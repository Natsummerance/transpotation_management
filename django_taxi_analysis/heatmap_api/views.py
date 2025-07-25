from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta
from sklearn.cluster import KMeans
import numpy as np
import requests
from .distance_distribution import analyze_distance_distribution
import math
import os
import json
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# 全局位置缓存
location_cache = {}


def save_location_cache():
    """保存位置缓存到文件"""
    try:
        with open('location_cache.json', 'w', encoding='utf-8') as f:
            json.dump(location_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'保存位置缓存失败: {e}')


def load_location_cache():
    """从文件加载位置缓存"""
    try:
        if os.path.exists('location_cache.json'):
            with open('location_cache.json', 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f'加载位置缓存失败: {e}')
    return {}


# 加载位置缓存
location_cache = load_location_cache()



class HeatmapDataView(APIView):
    """热力图数据API视图"""
    
    @swagger_auto_schema(
        operation_summary="获取上客/下客热力图数据",
        operation_description="根据事件类型、时间范围、网格大小等参数，返回聚合后的热力图点数据。",
        manual_parameters=[
            openapi.Parameter('event_type', openapi.IN_QUERY, description="事件类型(pickup=上客, dropoff=下客, all=全部)", type=openapi.TYPE_STRING),
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间(YYYY-MM-DD HH:MM:SS)", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间(YYYY-MM-DD HH:MM:SS)", type=openapi.TYPE_STRING),
            openapi.Parameter('limit', openapi.IN_QUERY, description="限制返回点数(默认1000)", type=openapi.TYPE_INTEGER),
            openapi.Parameter('grid_size', openapi.IN_QUERY, description="网格大小(默认0.001度，约100米)", type=openapi.TYPE_NUMBER),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'points': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
                    'total_count': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'time_range': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'event_type': openapi.Schema(type=openapi.TYPE_STRING),
                    'grid_size': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'point_count': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'gradient': openapi.Schema(type=openapi.TYPE_OBJECT),
                }
            )),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取上客热点地区热力图数据
        
        参数:
        - event_type: 事件类型 (pickup=上客, dropoff=下客, all=全部)
        - start_time: 开始时间 (YYYY-MM-DD HH:MM:SS)
        - end_time: 结束时间 (YYYY-MM-DD HH:MM:SS)
        - limit: 限制返回点数 (默认1000)
        - grid_size: 网格大小 (默认0.001度，约100米)
        """
        
        # 获取查询参数
        event_type = request.GET.get('event_type', 'pickup')  # 默认上客
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        limit = int(request.GET.get('limit', 1000))
        grid_size = float(request.GET.get('grid_size', 0.001))
        
        # 如果没有指定时间范围，默认查询最近24小时
        if not start_time:
            end_time = timezone.now()
            start_time = end_time - timedelta(hours=24)
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(hours=24)
        
        # 根据事件类型确定event_tag值
        if event_type == 'pickup':
            event_tag = 1
        elif event_type == 'dropoff':
            event_tag = 2
        else:
            event_tag = None
        
        try:
            # 使用原生SQL查询，提高性能
            with connection.cursor() as cursor:
                if event_tag is not None:
                    # 按网格聚合上客/下客点
                    sql = """
                    SELECT 
                        ROUND(gcj02_lat / %s) * %s as lat,
                        ROUND(gcj02_lon / %s) * %s as lng,
                        COUNT(*) as count
                    FROM taxi_gps_log 
                    WHERE event_tag = %s 
                    AND beijing_time BETWEEN %s AND %s
                    GROUP BY lat, lng
                    ORDER BY count DESC
                    LIMIT %s
                    """
                    cursor.execute(sql, [
                        grid_size, grid_size, 
                        grid_size, grid_size,
                        event_tag, start_time, end_time, limit
                    ])
                else:
                    # 查询所有事件类型
                    sql = """
                    SELECT 
                        ROUND(gcj02_lat / %s) * %s as lat,
                        ROUND(gcj02_lon / %s) * %s as lng,
                        event_tag,
                        COUNT(*) as count
                    FROM taxi_gps_log 
                    WHERE beijing_time BETWEEN %s AND %s
                    GROUP BY lat, lng, event_tag
                    ORDER BY count DESC
                    LIMIT %s
                    """
                    cursor.execute(sql, [
                        grid_size, grid_size, 
                        grid_size, grid_size,
                        start_time, end_time, limit
                    ])
                
                results = cursor.fetchall()
                
                # 格式化返回数据
                points = []
                total_count = 0
                
                for row in results:
                    if event_tag is not None:
                        lat, lng, count = row
                        event_tag_value = event_tag
                    else:
                        lat, lng, event_tag_value, count = row
                    
                    total_count += count
                    
                    points.append({
                        'lat': float(lat),
                        'lng': float(lng),
                        'count': count,
                        'event_tag': event_tag_value
                    })
                
                # 构建响应数据
                response_data = {
                    'points': points,
                    'total_count': total_count,
                    'time_range': {
                        'start': start_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'end': end_time.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'event_type': event_type,
                    'grid_size': grid_size,
                    'point_count': len(points),
                    'gradient': {
                        0.4: "#e3eafd",  # 更淡的蓝色
                        0.6: "cyan",
                        0.7: "lime",
                        0.8: "yellow",
                        1.0: "red"
                    }
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询数据时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StatisticsView(APIView):
    """统计数据API视图"""
    
    @swagger_auto_schema(
        operation_summary="获取统计数据",
        operation_description="根据时间范围，返回上客/下客订单数等统计信息。",
        manual_parameters=[
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取统计数据
        
        参数:
        - start_time: 开始时间
        - end_time: 结束时间
        """
        
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        
        # 默认查询最近7天
        if not start_time:
            end_time = timezone.now()
            start_time = end_time - timedelta(days=7)
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(days=7)
        
        try:
            with connection.cursor() as cursor:
                # 统计上客订单数（trip_id变化）
                sql_pickup = """
                SELECT trip_id FROM taxi_gps_log WHERE event_tag=1 AND beijing_time BETWEEN %s AND %s ORDER BY beijing_time
                """
                cursor.execute(sql_pickup, [start_time, end_time])
                pickup_trip_ids = [row[0] for row in cursor.fetchall()]
                pickup_count = 0
                if pickup_trip_ids:
                    last = pickup_trip_ids[0]
                    for t in pickup_trip_ids[1:]:
                        if t != last:
                            pickup_count += 1
                            last = t
                # 统计下客订单数（trip_id变化）
                sql_dropoff = """
                SELECT trip_id FROM taxi_gps_log WHERE event_tag=2 AND beijing_time BETWEEN %s AND %s ORDER BY beijing_time
                """
                cursor.execute(sql_dropoff, [start_time, end_time])
                dropoff_trip_ids = [row[0] for row in cursor.fetchall()]
                dropoff_count = 0
                if dropoff_trip_ids:
                    last = dropoff_trip_ids[0]
                    for t in dropoff_trip_ids[1:]:
                        if t != last:
                            dropoff_count += 1
                            last = t
                stats = {
                    'pickup_count': pickup_count,
                    'dropoff_count': dropoff_count,
                    'total_events': pickup_count + dropoff_count,
                    'time_range': {
                        'start': start_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'end': end_time.strftime('%Y-%m-%d %H:%M:%S')
                    }
                }
                return Response(stats, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询统计数据时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardDataView(APIView):
    """仪表板数据API视图 - 综合数据"""

    @swagger_auto_schema(
        operation_summary="获取仪表板所需的所有数据",
        operation_description="根据时间范围和事件类型，返回仪表板综合统计数据。",
        manual_parameters=[
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
            openapi.Parameter('event_type', openapi.IN_QUERY, description="事件类型(pickup/dropoff)", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            400: openapi.Response('参数错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取仪表板所需的所有数据
        参数:
        - start_time: 开始时间
        - end_time: 结束时间
        - event_type: pickup/dropoff/all
        """
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        event_type = request.GET.get('event_type', 'pickup')
        if event_type == 'pickup':
            event_tag = 1
        elif event_type == 'dropoff':
            event_tag = 2
        else:
            return Response({'error': 'event_type must be pickup or dropoff'}, status=400)

        start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
        if end_time:
            end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
        else:
            end_time = start_time + timedelta(days=1)

        def haversine(lat1, lon1, lat2, lon2):
            R = 6371.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            return R * c
        try:
            with connection.cursor() as cursor:
                params = [event_tag, start_time, end_time]
                # 1. 数据总量
                cursor.execute(
                    "SELECT COUNT(*) FROM taxi_gps_log "
                    "WHERE event_tag=%s "
                    "AND beijing_time BETWEEN %s AND %s",
                    params
                )
                total_count = cursor.fetchone()[0]
                # 2. 活跃车辆数
                cursor.execute(
                    "SELECT COUNT(DISTINCT car_plate) FROM taxi_gps_log "
                    "WHERE event_tag=%s "
                    "AND beijing_time BETWEEN %s AND %s",
                    params
                )
                active_vehicles = cursor.fetchone()[0]
                # 3. 平均速度
                cursor.execute(
                    "SELECT AVG(speed) FROM taxi_gps_log "
                    "WHERE event_tag=%s AND speed IS NOT NULL "
                    "AND beijing_time BETWEEN %s AND %s",
                    params
                )
                avg_speed = cursor.fetchone()[0] or 0
                # 4. 平均距离（每辆车每次上客到下客的距离，最后取平均）
                # 只统计本event_tag类型的点
                cursor.execute(
                    "SELECT car_plate, beijing_time, gcj02_lat, gcj02_lon "
                    "FROM taxi_gps_log "
                    "WHERE event_tag=%s "
                    "AND beijing_time BETWEEN %s AND %s "
                    "ORDER BY car_plate, beijing_time",
                    params
                )
                rows = cursor.fetchall()
                # 计算同一车辆相邻两点的距离，取平均
                trips = []
                last_point = {}
                for car_plate, t, lat, lon in rows:
                    if car_plate in last_point:
                        lat1, lon1 = last_point[car_plate]
                        dist = haversine(lat1, lon1, lat, lon)
                        trips.append(dist)
                    last_point[car_plate] = (lat, lon)
                avg_distance = round(sum(trips)/len(trips), 2) if trips else 0
                stats = {
                    'total_count': total_count,
                    'active_vehicles': active_vehicles,
                    'avg_distance': avg_distance,
                    'avg_speed': round(avg_speed, 2) if avg_speed else 0
                }
                response_data = {
                    'stats': stats,
                    'timeRange': {
                        'start': start_time,
                        'end': end_time
                    }
                }
                return Response(
                    response_data,
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询仪表板数据时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VehicleTrajectoryView(APIView):
    """车辆轨迹API视图（支持全部/单车）"""
    @swagger_auto_schema(
        operation_summary="获取车辆轨迹数据",
        operation_description="根据车牌号和时间范围，返回指定车辆或全部车辆的轨迹数据。",
        manual_parameters=[
            openapi.Parameter('car_plate', openapi.IN_QUERY, description="车牌号，all=全部车辆（前10）", type=openapi.TYPE_STRING),
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            400: openapi.Response('缺少car_plate参数', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取车辆轨迹数据
        参数:
        - car_plate: 车牌号，all=全部车辆（前10）
        - start_time: 开始时间
        - end_time: 结束时间
        """
        car_plate = request.GET.get('car_plate')
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        # 默认查询一天
        if not start_time:
            start_time = datetime.strptime("2013-09-12 00:00:00", '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime("2013-09-12 23:59:59", '%Y-%m-%d %H:%M:%S')
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(hours=1)
        try:
            with connection.cursor() as cursor:
                if car_plate == 'all':
                    # 查前10辆车
                    cursor.execute("SELECT DISTINCT car_plate FROM taxi_gps_log LIMIT 10")
                    plates = [row[0] for row in cursor.fetchall()]
                    data = []
                    for plate in plates:
                        cursor.execute("""
                            SELECT beijing_time, gcj02_lat, gcj02_lon, event_tag, speed
                            FROM taxi_gps_log
                            WHERE car_plate = %s AND beijing_time BETWEEN %s AND %s
                            ORDER BY beijing_time
                        """, [plate, start_time, end_time])
                        results = cursor.fetchall()
                        trajectory = []
                        for row in results:
                            beijing_time, lat, lon, event_tag, speed = row
                            trajectory.append({
                                'time': beijing_time.strftime('%Y-%m-%d %H:%M:%S'),
                                'lat': float(lat),
                                'lng': float(lon),
                                'event_tag': event_tag,
                                'speed': float(speed) if speed else 0
                            })
                        data.append({'car_plate': plate, 'trajectory': trajectory, 'point_count': len(trajectory)})
                    response_data = {
                        'data': data,
                        'time_range': {
                            'start': start_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(start_time, datetime) else start_time,
                            'end': end_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(end_time, datetime) else end_time
                        }
                    }
                    return Response(response_data, status=status.HTTP_200_OK)
                elif car_plate:
                    cursor.execute("""
                        SELECT beijing_time, gcj02_lat, gcj02_lon, event_tag, speed
                        FROM taxi_gps_log
                        WHERE car_plate = %s AND beijing_time BETWEEN %s AND %s
                        ORDER BY beijing_time
                    """, [car_plate, start_time, end_time])
                    results = cursor.fetchall()
                    trajectory = []
                    for row in results:
                        beijing_time, lat, lon, event_tag, speed = row
                        trajectory.append({
                            'time': beijing_time.strftime('%Y-%m-%d %H:%M:%S'),
                            'lat': float(lat),
                            'lng': float(lon),
                            'event_tag': event_tag,
                            'speed': float(speed) if speed else 0
                        })
                    response_data = {
                        'car_plate': car_plate,
                        'trajectory': trajectory,
                        'point_count': len(trajectory),
                        'time_range': {
                            'start': start_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(start_time, datetime) else start_time,
                            'end': end_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(end_time, datetime) else end_time
                        }
                    }
                    return Response(response_data, status=status.HTTP_200_OK)
                else:
                    return Response({'error': '缺少car_plate参数'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询车辆轨迹时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HotspotsAnalysisView(APIView):
    """热门上客点聚类分析API视图"""
    @swagger_auto_schema(
        operation_summary="热门上客点聚类分析",
        operation_description="根据时间范围和聚类参数，返回热门上客点的聚类分析结果。",
        manual_parameters=[
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
            openapi.Parameter('n_cluster', openapi.IN_QUERY, description="返回前N个聚类点（默认6）", type=openapi.TYPE_INTEGER),
            openapi.Parameter('n_clusters', openapi.IN_QUERY, description="聚类数（默认500）", type=openapi.TYPE_INTEGER),
            openapi.Parameter('event_type', openapi.IN_QUERY, description="事件类型(pickup/dropoff)", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            400: openapi.Response('聚类点数不足', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        n_cluster = int(request.GET.get('n_cluster', 6))
        n_clusters = int(request.GET.get('n_clusters', 500))  # 新增聚类数参数，默认6
        event_type = request.GET.get('event_type', 'pickup')
        if event_type == 'pickup':
            event_tag = 1
        elif event_type == 'dropoff':
            event_tag = 2
        else:
            event_tag = 1
        if not start_time:
            start_time = datetime.strptime("2013-09-12 00:00:00", '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime("2013-09-12 23:59:59", '%Y-%m-%d %H:%M:%S')
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(days=1)
        try:
            with connection.cursor() as cursor:
                # 查询所有event_tag为1或2的点
                sql = f'''
                SELECT 
                  ROUND(gcj02_lat, 5) as lat,
                  ROUND(gcj02_lon, 5) as lng,
                  COUNT(*) as point_count,
                  AVG(speed) as avg_speed,
                  SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_count
                FROM taxi_gps_log 
                WHERE (event_tag = {event_tag}) AND beijing_time BETWEEN %s AND %s
                GROUP BY ROUND(gcj02_lat, 5), ROUND(gcj02_lon, 5)
                HAVING point_count > 0
                ORDER BY point_count DESC
                '''
                cursor.execute(sql, [start_time, end_time])
                results = cursor.fetchall()
                if len(results) < n_clusters:
                    return Response({'error': '聚类点数不足'}, status=status.HTTP_400_BAD_REQUEST)
                coords = np.array([[float(row[0]), float(row[1])] for row in results])
                point_counts = np.array([row[2] for row in results])
                avg_speeds = np.array([row[3] for row in results])
                occupied_counts = np.array([row[4] for row in results])
                # 修正 n_init 类型为 int
                kmeans = KMeans(n_clusters=n_clusters, random_state=0, n_init='auto')
                labels = kmeans.fit_predict(coords, sample_weight=point_counts)
                clusters = []
                for i in range(n_clusters):
                    idx = (labels == i)
                    if not np.any(idx):
                        continue
                    cluster_points = coords[idx]
                    cluster_point_counts = point_counts[idx]
                    cluster_avg_speeds = avg_speeds[idx]
                    cluster_occupied_counts = occupied_counts[idx]
                    total_orders = int(cluster_point_counts.sum())
                    avg_lat = float(np.average(cluster_points[:, 0], weights=cluster_point_counts))
                    avg_lng = float(np.average(cluster_points[:, 1], weights=cluster_point_counts))
                    avg_speed = int(round(np.average(cluster_avg_speeds, weights=cluster_point_counts)))
                    occupancy_rate = int(round((cluster_occupied_counts.sum() / cluster_point_counts.sum()) * 100)) if cluster_point_counts.sum() else 0
                    clusters.append({
                        'orders': total_orders,
                        'lat': avg_lat,
                        'lng': avg_lng,
                        'avgSpeed': avg_speed,
                        'occupancyRate': occupancy_rate
                    })
                clusters = sorted(clusters, key=lambda x: x['orders'], reverse=True)[:n_cluster]
                # 逆地理编码，空位置重试一次
                def get_location_name(lat, lng, amap_key='c6115796bfbad53bd639041995b5b123', max_retry=2):
                    key = f'{lat:.5f},{lng:.5f}'
                    if key in location_cache:
                        return location_cache[key]
                    url = f'https://restapi.amap.com/v3/geocode/regeo?location={lng},{lat}&key={amap_key}&radius=100&extensions=base'
                    for _ in range(max_retry):
                        try:
                            resp = requests.get(url, timeout=2)
                            if resp.status_code == 200:
                                data = resp.json()
                                if data.get('status') == '1':
                                    address = data['regeocode'].get('formatted_address', '')
                                    # 修补：特定地名替换
                                    if address == '山东省济南市天桥区无影山街道无影山中路万虹中心(建设中)':
                                        address = '山东省济南市天桥区无影山街道无影山中路济南汽车总站'
                                    if address:
                                        location_cache[key] = address
                                        save_location_cache()
                                        return address
                        except Exception as e:
                            print(f'高德API异常: {e}')
                    location_cache[key] = ''
                    save_location_cache()
                    return ''
                hotspots = []
                for i, cluster in enumerate(clusters):
                    address = get_location_name(cluster['lat'], cluster['lng'])
                    hotspots.append({
                        'rank': i + 1,
                        'name': address,
                        'orders': cluster['orders'],
                        'growth': f'+{np.random.randint(5, 25)}%',
                        'lat': cluster['lat'],
                        'lng': cluster['lng'],
                        'avgSpeed': cluster['avgSpeed'],
                        'occupancyRate': cluster['occupancyRate']
                    })
                return Response({'hotspots': hotspots, 'time_range': {'start': start_time, 'end': end_time}}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e), 'message': '热门区域聚类分析失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FlowAnalysisView(APIView):
    """客流分析API视图"""
    
    @swagger_auto_schema(
        operation_summary="获取客流分析数据",
        operation_description="根据时间范围和分析类型，返回客流分析数据。",
        manual_parameters=[
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
            openapi.Parameter('analysis_type', openapi.IN_QUERY, description="分析类型(hourly=按小时, daily=按天, weekly=按周)", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取客流分析数据
        
        参数:
        - start_time: 开始时间
        - end_time: 结束时间
        - analysis_type: 分析类型 (hourly=按小时, daily=按天, weekly=按周)
        """
        
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        analysis_type = request.GET.get('analysis_type', 'hourly')
        
        # 默认查询2013-09-12的数据
        if not start_time:
            start_time = datetime.strptime("2013-09-12 00:00:00", '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime("2013-09-12 23:59:59", '%Y-%m-%d %H:%M:%S')
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(days=1)
        
        try:
            with connection.cursor() as cursor:
                if analysis_type == 'hourly':
                    # 按小时分析
                    sql = """
                    SELECT 
                        HOUR(beijing_time) as time_unit,
                        event_tag,
                        COUNT(*) as count
                    FROM taxi_gps_log 
                    WHERE event_tag IN (1, 2)
                    AND beijing_time BETWEEN %s AND %s
                    GROUP BY HOUR(beijing_time), event_tag
                    ORDER BY time_unit
                    """
                elif analysis_type == 'daily':
                    # 按天分析
                    sql = """
                    SELECT 
                        DATE(beijing_time) as time_unit,
                        event_tag,
                        COUNT(*) as count
                    FROM taxi_gps_log 
                    WHERE event_tag IN (1, 2)
                    AND beijing_time BETWEEN %s AND %s
                    GROUP BY DATE(beijing_time), event_tag
                    ORDER BY time_unit
                    """
                else:
                    # 按周分析
                    sql = """
                    SELECT 
                        WEEKDAY(beijing_time) as time_unit,
                        event_tag,
                        COUNT(*) as count
                    FROM taxi_gps_log 
                    WHERE event_tag IN (1, 2)
                    AND beijing_time BETWEEN %s AND %s
                    GROUP BY WEEKDAY(beijing_time), event_tag
                    ORDER BY time_unit
                    """
                
                cursor.execute(sql, [start_time, end_time])
                results = cursor.fetchall()
                
                # 处理数据
                flow_data = {}
                for row in results:
                    time_unit, event_tag, count = row
                    if time_unit not in flow_data:
                        flow_data[time_unit] = {'pickup': 0, 'dropoff': 0}
                    
                    if event_tag == 1:
                        flow_data[time_unit]['pickup'] = count
                    elif event_tag == 2:
                        flow_data[time_unit]['dropoff'] = count
                
                # 转换为数组格式
                flow_array = []
                for time_unit, data in sorted(flow_data.items()):
                    if analysis_type == 'hourly':
                        label = f"{time_unit:02d}:00"
                    elif analysis_type == 'daily':
                        label = str(time_unit)
                    else:
                        weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                        label = weekdays[time_unit]
                    
                    flow_array.append({
                        'time': label,
                        'pickup': data['pickup'],
                        'dropoff': data['dropoff'],
                        'total': data['pickup'] + data['dropoff']
                    })
                
                # 计算统计信息
                total_pickup = sum(data['pickup'] for data in flow_data.values())
                total_dropoff = sum(data['dropoff'] for data in flow_data.values())
                peak_hour = max(flow_data.items(), key=lambda x: x[1]['pickup'] + x[1]['dropoff'])[0] if flow_data else 0
                
                response_data = {
                    'flow_data': flow_array,
                    'statistics': {
                        'total_pickup': total_pickup,
                        'total_dropoff': total_dropoff,
                        'total_flow': total_pickup + total_dropoff,
                        'peak_hour': f"{peak_hour:02d}:00" if analysis_type == 'hourly' else str(peak_hour),
                        'analysis_type': analysis_type
                    },
                    'time_range': {
                        'start': start_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(start_time, datetime) else start_time,
                        'end': end_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(end_time, datetime) else end_time
                    }
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询客流分析时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SpatiotemporalAnalysisView(APIView):
    """时空分析API视图 - 综合数据"""
    
    @swagger_auto_schema(
        operation_summary="获取时空分析综合数据",
        operation_description="根据时间范围和图层类型，返回时空分析相关数据。",
        manual_parameters=[
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
            openapi.Parameter('layer_type', openapi.IN_QUERY, description="图层类型(heatmap, trajectory, hotspots, flow, trajectory_points, vehicle_heatmap)", type=openapi.TYPE_STRING),
            openapi.Parameter('current_time', openapi.IN_QUERY, description="当前时间（秒级）", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取时空分析综合数据
        
        参数:
        - start_time: 开始时间
        - end_time: 结束时间
        - layer_type: 图层类型 (heatmap, trajectory, hotspots, flow, trajectory_points, vehicle_heatmap)
        - current_time: 当前时间（秒级）
        """
        
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        layer_type = request.GET.get('layer_type', 'none')  # 默认无图层
        current_time = request.GET.get('current_time')  # 时间轴当前时间
        
        # 默认查询2139的数据
        if not start_time:
            start_time = 21300
            end_time = 21323959
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(days=1)
        
        try:
            with connection.cursor() as cursor:
                # 基础统计数据
                stats_sql = """
                SELECT 
                    event_tag,
                    COUNT(*) as count,
                    COUNT(DISTINCT car_plate) as unique_taxis
                FROM taxi_gps_log 
                WHERE event_tag IN (1, 2)
                AND beijing_time BETWEEN %s AND %s
                GROUP BY event_tag
                """
                cursor.execute(stats_sql, [start_time, end_time])
                stats_results = cursor.fetchall()
                
                # 按小时统计
                hourly_sql = """
                SELECT 
                    HOUR(beijing_time) as hour,
                    event_tag,
                    COUNT(*) as count
                FROM taxi_gps_log 
                WHERE event_tag IN (1, 2)
                AND beijing_time BETWEEN %s AND %s
                GROUP BY HOUR(beijing_time), event_tag
                ORDER BY hour
                """
                cursor.execute(hourly_sql, [start_time, end_time])
                hourly_results = cursor.fetchall()
                
                # 热门上客点
                hotspots_sql = """
                SELECT 
                    ROUND(gcj02_lat / 0.001) * 0.001 as lat,
                    ROUND(gcj02_lon / 0.001) * 0.001 as lng,
                    COUNT(*) as count
                FROM taxi_gps_log 
                WHERE event_tag = 1
                AND beijing_time BETWEEN %s AND %s
                GROUP BY lat, lng
                ORDER BY count DESC
                LIMIT 10
                """
                cursor.execute(hotspots_sql, [start_time, end_time])
                hotspots_results = cursor.fetchall()
                
                # 处理统计数据
                stats = {
                    'totalOrders': 0,
                    'avgDistance': 8.5,
                    'peakHour': '18:00',
                    'activeArea': '历下区'
                }
                
                for event_tag, count, unique_count in stats_results:
                    if event_tag == 1:  # 上客
                        stats['totalOrders'] = count
                
                # 处理小时数据
                hourly_data = {i: 0 for i in range(24)}
                for hour, event_tag, count in hourly_results:
                    if event_tag == 1:  # 只统计上客
                        hourly_data[hour] = count
                
                # 找到高峰时段
                peak_hour = max(hourly_data.items(), key=lambda x: x[1])[0]
                stats['peakHour'] = f"{peak_hour:02d}:00"
                
                # 处理热点数据
                top_pickup_points = []
                for i, (lat, lng, count) in enumerate(hotspots_results, 1):
                    # 根据坐标判断区域（简化处理）
                    area_names = ['历下区', '市中区', '槐荫区', '天桥区', '历城区']
                    area_index = int(abs(lat - 36.6758) * 100) % len(area_names)
                    
                    top_pickup_points.append({
                        'rank': i,
                        'name': f"{area_names[area_index]}热点{i}",
                        'count': count,
                        'lat': float(lat),
                        'lng': float(lng)
                    })
                
                # 根据图层类型获取相应数据
                layer_data = {}
                
                if layer_type == 'vehicle_heatmap' and current_time:
                    # 获取指定时间点的车辆位置热力图数据
                    vehicle_heatmap_sql = """
                    SELECT 
                        ROUND(gcj02_lat, 3) as lat,
                        ROUND(gcj02_lon, 3) as lng,
                        COUNT(*) as count
                    FROM taxi_gps_log 
                    WHERE beijing_time BETWEEN %s AND %s
                    GROUP BY ROUND(gcj02_lat, 3), ROUND(gcj02_lon, 3)
                    ORDER BY count DESC
                    LIMIT 1000
                    """
                    # 时间窗口：当前时间前后5分钟
                    time_window = 5  # 分钟
                    current_dt = datetime.strptime(current_time, '%Y-%m-%d %H:%M:%S')
                    start_window = current_dt - timedelta(minutes=time_window)
                    end_window = current_dt + timedelta(minutes=time_window)
                    
                    cursor.execute(vehicle_heatmap_sql, [start_window, end_window])
                    vehicle_heatmap_results = cursor.fetchall()
                    
                    layer_data['vehicleHeatmapPoints'] = [
                        {
                            'latitude': float(lat),
                            'longitude': float(lng),
                            'intensity': int(count)
                        }
                        for lat, lng, count in vehicle_heatmap_results
                    ]
                
                # 轨迹点（所有车辆当前时刻位置，按秒）
                if layer_type == 'trajectory_points' and current_time:
                    current_dt = datetime.strptime(current_time, '%Y-%m-%d %H:%M:%S')
                    start_sec = current_dt - timedelta(seconds=0.5)
                    end_sec = current_dt + timedelta(seconds=0.5)
                    # 先查所有车在该秒内的点
                    cursor.execute('''
                        SELECT car_plate, gcj02_lat, gcj02_lon, speed, event_tag, beijing_time, heading
                        FROM (
                            SELECT *, ROW_NUMBER() OVER (PARTITION BY car_plate ORDER BY ABS(TIMESTAMPDIFF(SECOND, beijing_time, %s))) as rn
                            FROM taxi_gps_log
                            WHERE beijing_time BETWEEN %s AND %s
                        ) t
                        WHERE rn = 1
                    ''', [current_dt, start_sec, end_sec])
                    results = cursor.fetchall()
                    trajectory_points = []
                    for row in results:
                        car_plate, lat, lng, speed, event_tag, beijing_time, heading = row
                        trajectory_points.append({
                            'car_plate': car_plate,
                            'lat': float(lat),
                            'lng': float(lng),
                            'speed': float(speed) if speed else 0,
                            'event_tag': event_tag,
                            'time': beijing_time.strftime('%Y-%m-%d %H:%M:%S'),
                            'heading': int(heading) if heading is not None else 0
                        })
                    layer_data['trajectoryPoints'] = trajectory_points
                
                # 构建响应数据
                response_data = {
                    'totalOrders': stats['totalOrders'],
                    'avgDistance': stats['avgDistance'],
                    'peakHour': stats['peakHour'],
                    'activeArea': stats['activeArea'],
                    'hourlyData': hourly_data,
                    'topPickupPoints': top_pickup_points,
                    'layerType': layer_type,
                    'layerData': layer_data,
                    'currentTime': current_time,
                    'timeRange': {
                        'start': start_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(start_time, datetime) else start_time,
                        'end': end_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(end_time, datetime) else end_time
                    }
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询时空分析时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DistanceDistributionView(APIView):
    """路程分布分析API视图"""
    @swagger_auto_schema(
        operation_summary="获取路程分布分析数据",
        operation_description="根据时间范围，返回路程分布分析结果。",
        manual_parameters=[
            openapi.Parameter('start_time', openapi.IN_QUERY, description="开始时间", type=openapi.TYPE_STRING),
            openapi.Parameter('end_time', openapi.IN_QUERY, description="结束时间", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        # 默认时间范围
        if not start_time:
            start_time = datetime.strptime("2013-09-12 00:00:00", '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime("2013-09-12 23:59:59", '%Y-%m-%d %H:%M:%S')
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
        result = analyze_distance_distribution(start_time.strftime('%Y-%m-%d %H:%M:%S'), end_time.strftime('%Y-%m-%d %H:%M:%S'))
        return Response(result, status=status.HTTP_200_OK)

class VehicleIdListView(APIView):
    """车辆ID列表API视图"""
    @swagger_auto_schema(
        operation_summary="获取车辆ID列表",
        operation_description="返回所有车辆的ID列表。",
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT DISTINCT car_plate FROM taxi_gps_log LIMIT 1000")
                ids = [row[0] for row in cursor.fetchall()]
            return Response({'vehicle_ids': ids}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WeeklyPassengerFlowView(APIView):
    """流量分布API视图"""
    @swagger_auto_schema(
        operation_summary="获取周客流量分布数据",
        operation_description="根据模式和时间范围，返回周客流量分布数据。",
        manual_parameters=[
            openapi.Parameter('mode', openapi.IN_QUERY, description="模式(weekly=周客流量分布, custom=自定义)", type=openapi.TYPE_STRING),
            openapi.Parameter('custom_start', openapi.IN_QUERY, description="自定义开始时间(YYYY-MM-DD HH:MM:SS)", type=openapi.TYPE_STRING),
            openapi.Parameter('custom_end', openapi.IN_QUERY, description="自定义结束时间(YYYY-MM-DD HH:MM:SS)", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('成功', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            400: openapi.Response('参数错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
            500: openapi.Response('服务器错误', schema=openapi.Schema(type=openapi.TYPE_OBJECT))
        }
    )
    def get(self, request):
        """
        获取周客流量分布数据
        
        参数:
        - mode: 模式 (weekly=周客流量分布, custom=自定义)
        - custom_start: 自定义开始时间 (YYYY-MM-DD HH:MM:SS)
        - custom_end: 自定义结束时间 (YYYY-MM-DD HH:MM:SS)
        """
        try:
            # 调试：检查数据库连接
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
                
                # 检查表是否存在
                cursor.execute("SHOW TABLES LIKE 'taxi_gps_log'")
                table_exists = cursor.fetchone()
                if not table_exists:
                    return Response({
                        'error': 'taxi_gps_log表不存在',
                        'message': '请检查数据库表结构'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # 检查表中是否有数据
                cursor.execute("SELECT COUNT(*) FROM taxi_gps_log")
                count = cursor.fetchone()[0]
                if count == 0:
                    return Response({
                        'error': 'taxi_gps_log表中没有数据',
                        'message': '请检查数据是否已导入'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except Exception as e:
            return Response({
                'error': f'数据库连接失败: {str(e)}',
                'message': '数据库连接错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        mode = request.GET.get('mode', 'weekly')
        
        if mode == 'weekly':
            # 固定周客流量分布：213-9-9
            start_time = datetime.strptime("2013-09-12 00:00:00", '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime("2013-09-18 23:59:59", '%Y-%m-%d %H:%M:%S')
        else:
            # 自定义模式：使用前端传入的时间范围
            custom_start = request.GET.get('custom_start')
            custom_end = request.GET.get('custom_end')
            
            if not custom_start or not custom_end:
                return Response({
                    'error': '自定义模式需要提供custom_start和custom_end参数'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            start_time = datetime.strptime(custom_start, '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime(custom_end, '%Y-%m-%d %H:%M:%S')
        
        try:
            with connection.cursor() as cursor:
                # 按5分钟间隔统计event_tag=1和event_tag=3的数据
                sql = r"""
                SELECT 
                    CONCAT(
                        DATE_FORMAT(beijing_time, '%%Y-%%m-%%d %%H:'),
                        LPAD(FLOOR(MINUTE(beijing_time)/5)*5, 2, '0')
                    ) as time_slot,
                    COUNT(*) as count
                FROM taxi_gps_log 
                WHERE event_tag IN (1, 3)
                AND beijing_time BETWEEN %s AND %s
                GROUP BY time_slot
                ORDER BY time_slot
                """
  
                
                cursor.execute(sql, [start_time, end_time])
                results = cursor.fetchall()
                
                # 处理数据，确保5分钟间隔完整
                flow_data = []
                current_time = datetime.strptime(start_time.strftime('%Y-%m-%d %H:%M:%S'), '%Y-%m-%d %H:%M:%S')
                end_datetime = datetime.strptime(end_time.strftime('%Y-%m-%d %H:%M:%S'), '%Y-%m-%d %H:%M:%S')
                
                # 创建时间点映射
                time_slot_map = {}
                for row in results:
                    time_slot, count = row
                    time_slot_map[time_slot] = count
                
                # 生成完整的时间序列（5分钟间隔）
                while current_time <= end_datetime:
                    time_slot = current_time.strftime('%Y-%m-%d %H:%M')
                    count = time_slot_map.get(time_slot, 0)
                    
                    flow_data.append({
                        'time': time_slot,
                        'count': count
                    })
                    
                    # 增加5分钟
                    current_time += timedelta(minutes=5)
                
                # 计算统计信息
                total_count = sum(item['count'] for item in flow_data)
                max_count = max(item['count'] for item in flow_data) if flow_data else 0
                avg_count = total_count / len(flow_data) if flow_data else 0
                
                # 找到峰值时间
                peak_time = None
                if flow_data:
                    peak_item = max(flow_data, key=lambda x: x['count'])
                    peak_time = peak_item['time']
                
                response_data = {
                    'flow_data': flow_data,
                    'statistics': {
                        'total_count': total_count,
                        'max_count': max_count,
                        'avg_count': round(avg_count, 2),
                        'peak_time': peak_time,
                        'mode': mode
                    },
                    'time_range': {
                        'start': start_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(start_time, datetime) else start_time,
                        'end': end_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(end_time, datetime) else end_time
                    }
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询周客流量分布时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
