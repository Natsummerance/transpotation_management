import mysql.connector

# 数据库配置
config = {
    'host': '111.161.121.11',
    'port': 47420,
    'user': 'root',
    'password': '239108',
    'database': 'tm',
}

try:
    print("🔍 查看出租车GPS数据时间分布...")
    print("="*50)
    
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # 1. 查看数据总量
    cursor.execute("SELECT COUNT(*) FROM taxi_gps_log")
    total_count = cursor.fetchone()[0]
    print(f"📊 总数据量: {total_count:,} 条记录")
    
    # 2. 查看时间范围
    cursor.execute("SELECT MIN(beijing_time), MAX(beijing_time) FROM taxi_gps_log")
    min_time, max_time = cursor.fetchone()
    print(f"📅 时间范围: {min_time} 至 {max_time}")
    
    # 3. 查看上客事件数量
    cursor.execute("SELECT COUNT(*) FROM taxi_gps_log WHERE event_tag = 1")
    pickup_count = cursor.fetchone()[0]
    print(f"🚗 上客事件: {pickup_count:,} 条")
    
    # 4. 查看下客事件数量
    cursor.execute("SELECT COUNT(*) FROM taxi_gps_log WHERE event_tag = 2")
    dropoff_count = cursor.fetchone()[0]
    print(f"🚪 下客事件: {dropoff_count:,} 条")
    
    # 5. 按年份统计数据量
    cursor.execute("""
        SELECT YEAR(beijing_time) as year, COUNT(*) as count 
        FROM taxi_gps_log 
        GROUP BY YEAR(beijing_time) 
        ORDER BY year
    """)
    year_stats = cursor.fetchall()
    print(f"\n📈 按年份统计:")
    for year, count in year_stats:
        print(f"   {year}年: {count:,} 条")
    
    # 6. 按月份统计（最近一年）
    cursor.execute("""
        SELECT YEAR(beijing_time) as year, MONTH(beijing_time) as month, COUNT(*) as count 
        FROM taxi_gps_log 
        WHERE YEAR(beijing_time) = (SELECT MAX(YEAR(beijing_time)) FROM taxi_gps_log)
        GROUP BY YEAR(beijing_time), MONTH(beijing_time) 
        ORDER BY year, month
    """)
    month_stats = cursor.fetchall()
    if month_stats:
        print(f"\n📅 按月份统计 (最新年份):")
        for year, month, count in month_stats:
            print(f"   {year}年{month}月: {count:,} 条")
    
    # 7. 查看一些示例数据
    cursor.execute("""
        SELECT beijing_time, car_plate, gcj02_lat, gcj02_lon, event_tag, is_occupied 
        FROM taxi_gps_log 
        WHERE event_tag IN (1, 2) 
        ORDER BY beijing_time 
        LIMIT 10
    """)
    sample_data = cursor.fetchall()
    print(f"\n🔍 示例数据 (前10条上客/下客事件):")
    for row in sample_data:
        time, plate, lat, lng, event_tag, occupied = row
        event_type = "上客" if event_tag == 1 else "下客"
        print(f"   {time} | {plate} | ({lat:.6f}, {lng:.6f}) | {event_type} | 载客:{occupied}")
    
    # 8. 查看最近的数据
    cursor.execute("""
        SELECT beijing_time, car_plate, event_tag 
        FROM taxi_gps_log 
        ORDER BY beijing_time DESC 
        LIMIT 5
    """)
    recent_data = cursor.fetchall()
    print(f"\n🕒 最新数据 (前5条):")
    for row in recent_data:
        time, plate, event_tag = row
        event_type = "上客" if event_tag == 1 else "下客" if event_tag == 2 else f"事件{event_tag}"
        print(f"   {time} | {plate} | {event_type}")
    
    cursor.close()
    conn.close()
    print("\n✅ 数据检查完成！")
    
except Exception as e:
    print(f"❌ 连接失败: {e}")
    print("请检查数据库配置是否正确") 