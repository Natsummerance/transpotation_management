from django.db import connection
from typing import List, Dict
import math


def get_distance(lat1, lon1, lat2, lon2):
    # Haversine公式计算两点间距离（单位：公里）
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def analyze_distance_distribution(start_time: str, end_time: str) -> List[Dict]:
    """
    统计所有车辆在指定时间范围内的订单路程分布。
    event_tag=1为上客，event_tag=2为下客，
    两个之间为一个订单，只有event_tag=2才算订单完成。
    返回各区间订单数。
    """
    with connection.cursor() as cursor:
        # 查询所有车辆的上/下客点，按车牌和时间排序
        cursor.execute(
            'SELECT car_plate, beijing_time, gcj02_lat, gcj02_lon, event_tag '
            'FROM taxi_gps_log '
            'WHERE event_tag IN (1,2) AND beijing_time BETWEEN %s AND %s '
            'ORDER BY car_plate, beijing_time',
            [start_time, end_time]
        )
        rows = cursor.fetchall()

    # 每个订单为dict: {car_plate, start_time, end_time, start_lat, start_lon,
    # end_lat, end_lon, distance}
    orders = []
    current_order = None
    for row in rows:
        car_plate, time, lat, lon, event_tag = row
        if event_tag == 1:
            # 新订单开始
            current_order = {
                'car_plate': car_plate,
                'start_time': time,
                'start_lat': lat,
                'start_lon': lon
            }
        elif event_tag == 2 and current_order and car_plate == current_order['car_plate']:
            # 订单完成
            current_order['end_time'] = time
            current_order['end_lat'] = lat
            current_order['end_lon'] = lon
            # 计算距离
            dist = get_distance(
                current_order['start_lat'],
                current_order['start_lon'],
                lat,
                lon
            )
            current_order['distance'] = dist
            orders.append(current_order)
            current_order = None
        else:
            # 非法序列，忽略
            current_order = None
    # 距离区间统计
    bins = [0, 2, 5, 10, 20, 50, 100]
    bin_labels = [
        '0-2km', '2-5km', '5-10km', '10-20km',
        '20-50km', '50-100km', '100km+'
    ]
    counts = [0 for _ in bin_labels]
    for order in orders:
        d = order['distance']
        for i, b in enumerate(bins):
            if i == len(bins) - 1:
                if d >= bins[-1]:
                    counts[-1] += 1
            elif b <= d < bins[i + 1]:
                counts[i] += 1
                break
    total = sum(counts)
    result = []
    for i, label in enumerate(bin_labels):
        percent = round(counts[i] / total * 100, 1) if total else 0.0
        result.append({
            'range': label,
            'count': counts[i],
            'percentage': percent
        })
    return result 