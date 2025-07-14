from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta
import json
import math
from sklearn.cluster import KMeans
import numpy as np
import requests
import time

class HeatmapDataView(APIView):
    """热力图数据API视图"""
    
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
                    'point_count': len(points)
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询数据时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StatisticsView(APIView):
    """统计数据API视图"""
    
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
    
    def get(self, request):
        """
        获取仪表板所需的所有数据
        
        参数:
        - start_time: 开始时间
        - end_time: 结束时间
        """
        
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        
        # 默认查询2013-09-12的数据
        if not start_time:
            start_time = "2013-09-12 00:00:00"
            end_time = "2013-09-12 23:59:59"
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(days=1)
        
        try:
            with connection.cursor() as cursor:
                # 1. 基础统计数据（totalOrders）
                sql_pickup = """
                SELECT trip_id, beijing_time FROM taxi_gps_log WHERE event_tag=1 AND beijing_time BETWEEN %s AND %s ORDER BY beijing_time
                """
                cursor.execute(sql_pickup, [start_time, end_time])
                pickup_trip_ids = [row[0] for row in cursor.fetchall()]
                totalOrders = 0
                if pickup_trip_ids:
                    last = pickup_trip_ids[0]
                    for t in pickup_trip_ids[1:]:
                        if t != last:
                            totalOrders += 1
                            last = t
                # 2. 周流量统计（按小时，基于trip_id变化）
                weekly_sql = """
                SELECT HOUR(beijing_time) as hour, trip_id 
                FROM taxi_gps_log 
                WHERE event_tag=1 AND beijing_time BETWEEN %s AND %s 
                ORDER BY beijing_time
                """
                cursor.execute(weekly_sql, [start_time, end_time])
                results = cursor.fetchall()
                hourly_data = {i: {'pickup': 0, 'dropoff': 0} for i in range(24)}
                last_trip = None
                for hour, trip_id in results:
                    if last_trip is not None and trip_id != last_trip:
                        hourly_data[hour]['pickup'] += 1
                    last_trip = trip_id
                # 3. 热点排名（基于trip_id变化）
                hotspots_sql = """
                SELECT ROUND(gcj02_lat / 0.001) * 0.001 as lat, 
                       ROUND(gcj02_lon / 0.001) * 0.001 as lng, 
                       trip_id 
                FROM taxi_gps_log 
                WHERE event_tag = 1 AND beijing_time BETWEEN %s AND %s 
                ORDER BY beijing_time
                """
                cursor.execute(hotspots_sql, [start_time, end_time])
                results = cursor.fetchall()
                grid_dict = {}
                for lat, lng, trip_id in results:
                    key = (float(lat), float(lng))
                    if key not in grid_dict:
                        grid_dict[key] = []
                    grid_dict[key].append(trip_id)
                hotspots_ranking = []
                for (lat, lng), trip_ids in grid_dict.items():
                    count = 0
                    last = trip_ids[0]
                    for t in trip_ids[1:]:
                        if t != last:
                            count += 1
                            last = t
                    hotspots_ranking.append({
                        'location': f"{lat:.4f}, {lng:.4f}",
                        'count': count,
                        'lat': lat,
                        'lng': lng
                    })
                hotspots_ranking = sorted(hotspots_ranking, key=lambda x: x['count'], reverse=True)[:10]
                # 4. 距离分布（模拟，基于trip_id变化）
                distance_sql = """
                SELECT taxi_id, trip_id 
                FROM taxi_gps_log 
                WHERE event_tag = 1 AND beijing_time BETWEEN %s AND %s 
                ORDER BY beijing_time
                """
                cursor.execute(distance_sql, [start_time, end_time])
                results = cursor.fetchall()
                taxi_dict = {}
                for taxi_id, trip_id in results:
                    if taxi_id not in taxi_dict:
                        taxi_dict[taxi_id] = []
                    taxi_dict[taxi_id].append(trip_id)
                trip_counts = []
                for trip_ids in taxi_dict.values():
                    count = 0
                    last = trip_ids[0]
                    for t in trip_ids[1:]:
                        if t != last:
                            count += 1
                            last = t
                    trip_counts.append(count)
                if trip_counts:
                    distance_distribution = [
                        {'range': '0-5单', 'count': len([c for c in trip_counts if c <= 5])},
                        {'range': '6-10单', 'count': len([c for c in trip_counts if 6 <= c <= 10])},
                        {'range': '11-15单', 'count': len([c for c in trip_counts if 11 <= c <= 15])},
                        {'range': '16-20单', 'count': len([c for c in trip_counts if 16 <= c <= 20])},
                        {'range': '20+单', 'count': len([c for c in trip_counts if c > 20])}
                    ]
                else:
                    distance_distribution = [
                        {'range': '0-5单', 'count': 0},
                        {'range': '6-10单', 'count': 0},
                        {'range': '11-15单', 'count': 0},
                        {'range': '16-20单', 'count': 0},
                        {'range': '20+单', 'count': 0}
                    ]
                # 构建响应数据
                stats = {
                    'totalOrders': totalOrders,
                    'activeVehicles': len(taxi_dict),
                    'totalRevenue': totalOrders * 25,
                    'avgDistance': 8.5
                }
                weekly_flow = [
                    {
                        'hour': f"{i:02d}:00",
                        'pickup': data['pickup'],
                        'dropoff': data['dropoff']
                    }
                    for i, data in hourly_data.items()
                ]
                response_data = {
                    'stats': stats,
                    'weeklyFlow': weekly_flow,
                    'hotspotsRanking': hotspots_ranking,
                    'distanceDistribution': distance_distribution,
                    'timeRange': {
                        'start': start_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(start_time, datetime) else start_time,
                        'end': end_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(end_time, datetime) else end_time
                    }
                }
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'message': '查询仪表板数据时发生错误'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VehicleTrajectoryView(APIView):
    """车辆轨迹API视图（支持全部/单车）"""
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
            start_time = "2013-09-12 00:00:00"
            end_time = "2013-09-12 23:59:59"
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
    def get(self, request):
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        n_clusters = int(request.GET.get('n_clusters', 400))  # 新增聚类数参数，默认6
        if not start_time:
            start_time = "2013-09-12 00:00:00"
            end_time = "2013-09-12 23:59:59"
        else:
            start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
            if end_time:
                end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
            else:
                end_time = start_time + timedelta(days=1)
        try:
            with connection.cursor() as cursor:
                # 查询所有event_tag为1或2的点
                sql = '''
                SELECT 
                  ROUND(gcj02_lat, 5) as lat,
                  ROUND(gcj02_lon, 5) as lng,
                  COUNT(*) as point_count,
                  AVG(speed) as avg_speed,
                  SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_count
                FROM taxi_gps_log 
                WHERE (event_tag = 1 OR event_tag = 2) AND beijing_time BETWEEN %s AND %s
                GROUP BY ROUND(gcj02_lat, 5), ROUND(gcj02_lon, 5)
                HAVING point_count > 0
                ORDER BY point_count DESC
                '''
                cursor.execute(sql, [start_time, end_time])
                results = cursor.fetchall()
                # 只取point_count最高的前1000个点用于聚类
                # results = results[:562]
                if len(results) < n_clusters:
                    return Response({'error': '聚类点数不足'}, status=status.HTTP_400_BAD_REQUEST)
                # 组装聚类输入
                coords = np.array([[float(row[0]), float(row[1])] for row in results])
                point_counts = np.array([row[2] for row in results])
                avg_speeds = np.array([row[3] for row in results])
                occupied_counts = np.array([row[4] for row in results])
                # KMeans聚类
                kmeans = KMeans(n_clusters=n_clusters, random_state=0, n_init=10)
                labels = kmeans.fit_predict(coords, sample_weight=point_counts)
                # 聚类统计
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
                # 按订单数排序，只取前6个类
                clusters = sorted(clusters, key=lambda x: x['orders'], reverse=True)[:6]
                # 逆地理编码
                def get_location_name(lat, lng, amap_key='c6115796bfbad53bd639041995b5b123'):
                    url = f'https://restapi.amap.com/v3/geocode/regeo?location={lng},{lat}&key={amap_key}&radius=100&extensions=base'
                    try:
                        resp = requests.get(url, timeout=2)
                        if resp.status_code == 200:
                            data = resp.json()
                            if data.get('status') == '1':
                                return data['regeocode'].get('formatted_address', '')
                    except Exception as e:
                        print(f'高德API异常: {e}')
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
            start_time = "2013-09-12 00:00:00"
            end_time = "2013-09-12 23:59:59"
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
    
    def get(self, request):
        """
        获取时空分析综合数据
        
        参数:
        - start_time: 开始时间
        - end_time: 结束时间
        - layer_type: 图层类型 (heatmap, trajectory, hotspots, flow)
        """
        
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        layer_type = request.GET.get('layer_type', 'heatmap')
        
        # 默认查询2013-09-12的数据
        if not start_time:
            start_time = "2013-09-12 00:00:00"
            end_time = "2013-09-12 23:59:59"
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
                    COUNT(DISTINCT taxi_id) as unique_taxis
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
                
                # 构建响应数据
                response_data = {
                    'totalOrders': stats['totalOrders'],
                    'avgDistance': stats['avgDistance'],
                    'peakHour': stats['peakHour'],
                    'activeArea': stats['activeArea'],
                    'hourlyData': hourly_data,
                    'topPickupPoints': top_pickup_points,
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


class VehicleIdListView(APIView):
    """车辆ID列表API视图"""
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT DISTINCT car_plate FROM taxi_gps_log LIMIT 1000")
                ids = [row[0] for row in cursor.fetchall()]
            return Response({'vehicle_ids': ids}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
