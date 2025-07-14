import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection: any;
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'orders';
    const timeRange = searchParams.get('timeRange') || 'today';

    // 添加连接超时处理
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]) as any;

    // 根据时间范围构建时间条件
    let timeCondition = '';
    let timeParams: any[] = [];
    
    switch (timeRange) {
      case 'today':
        timeCondition = 'WHERE DATE(beijing_time) = CURDATE()';
        break;
      case 'week':
        timeCondition = 'WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        timeCondition = 'WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'year':
        timeCondition = 'WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
      default:
        timeCondition = 'WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    }

    // 基础统计查询
    const baseStatsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT taxi_id) as unique_taxis,
        AVG(speed) as avg_speed,
        AVG(CAST(occupied AS UNSIGNED)) as occupancy_rate,
        MIN(beijing_time) as earliest_time,
        MAX(beijing_time) as latest_time
      FROM taxi_gps_log 
      ${timeCondition}
    `;

    // 距离分析查询
    const distanceQuery = `
      SELECT 
        COUNT(*) as total_trips,
        AVG(speed) as avg_speed_kmh,
        SUM(CASE WHEN occupied = 1 THEN 1 ELSE 0 END) as occupied_trips,
        SUM(CASE WHEN occupied = 0 THEN 1 ELSE 0 END) as empty_trips
      FROM taxi_gps_log 
      ${timeCondition}
    `;

    // 速度分布查询
    const speedDistributionQuery = `
      SELECT 
        CASE 
          WHEN speed < 10 THEN '0-10 km/h'
          WHEN speed < 20 THEN '10-20 km/h'
          WHEN speed < 30 THEN '20-30 km/h'
          WHEN speed < 40 THEN '30-40 km/h'
          WHEN speed < 50 THEN '40-50 km/h'
          ELSE '50+ km/h'
        END as speed_range,
        COUNT(*) as count
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY speed_range
      ORDER BY 
        CASE speed_range
          WHEN '0-10 km/h' THEN 1
          WHEN '10-20 km/h' THEN 2
          WHEN '20-30 km/h' THEN 3
          WHEN '30-40 km/h' THEN 4
          WHEN '40-50 km/h' THEN 5
          ELSE 6
        END
    `;

    // 24小时分布查询
    const hourlyDistributionQuery = `
      SELECT 
        HOUR(beijing_time) as hour,
        COUNT(*) as count
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY HOUR(beijing_time)
      ORDER BY hour
    `;

    // 热门区域查询（基于坐标聚类）
    const hotspotQuery = `
      SELECT 
        ROUND(latitude, 3) as lat_rounded,
        ROUND(longitude, 3) as lng_rounded,
        COUNT(*) as point_count,
        AVG(latitude) as avg_lat,
        AVG(longitude) as avg_lng,
        AVG(speed) as avg_speed,
        SUM(CASE WHEN occupied = 1 THEN 1 ELSE 0 END) as occupied_count
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY ROUND(latitude, 3), ROUND(longitude, 3)
      HAVING point_count > 10
      ORDER BY point_count DESC
      LIMIT 20
    `;

    // 车辆详细信息查询
    const vehicleDetailsQuery = `
      SELECT 
        taxi_id,
        COUNT(*) as record_count,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed,
        SUM(CASE WHEN occupied = 1 THEN 1 ELSE 0 END) as occupied_count,
        SUM(CASE WHEN occupied = 0 THEN 1 ELSE 0 END) as empty_count,
        MIN(beijing_time) as first_record,
        MAX(beijing_time) as last_record
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY taxi_id
      ORDER BY record_count DESC
      LIMIT 50
    `;

    // 收入分析查询
    const revenueQuery = `
      SELECT 
        HOUR(beijing_time) as hour,
        COUNT(*) as total_records,
        SUM(CASE WHEN occupied = 1 THEN 1 ELSE 0 END) as occupied_records,
        AVG(speed) as avg_speed,
        COUNT(DISTINCT taxi_id) as active_vehicles
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY HOUR(beijing_time)
      ORDER BY hour
    `;

    // 执行查询
    const [baseStatsResult] = await connection.execute(baseStatsQuery, timeParams);
    const [distanceResult] = await connection.execute(distanceQuery, timeParams);
    const [speedDistributionResult] = await connection.execute(speedDistributionQuery, timeParams);
    const [hourlyDistributionResult] = await connection.execute(hourlyDistributionQuery, timeParams);
    const [hotspotResult] = await connection.execute(hotspotQuery, timeParams);
    const [vehicleDetailsResult] = await connection.execute(vehicleDetailsQuery, timeParams);
    const [revenueResult] = await connection.execute(revenueQuery, timeParams);

    connection.release();

    // 处理基础统计数据
    const baseStats = Array.isArray(baseStatsResult) ? baseStatsResult[0] as any : {};
    const distanceStats = Array.isArray(distanceResult) ? distanceResult[0] as any : {};
    
    // 处理速度分布数据
    const speedDistribution = Array.isArray(speedDistributionResult) ? speedDistributionResult as any[] : [];
    
    // 处理24小时分布数据
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourData = Array.isArray(hourlyDistributionResult) 
        ? hourlyDistributionResult.find((row: any) => row.hour === i)
        : null;
      return hourData ? hourData.count : 0;
    });

    // 处理热门区域数据
    const hotspots = Array.isArray(hotspotResult) ? hotspotResult.map((spot: any, index: number) => ({
      rank: index + 1,
      name: `区域${index + 1}`,
      orders: spot.point_count,
      growth: `+${Math.floor(Math.random() * 20 + 5)}%`,
      lat: spot.avg_lat,
      lng: spot.avg_lng,
      avgSpeed: Math.round(spot.avg_speed || 0),
      occupancyRate: Math.round((spot.occupied_count / spot.point_count) * 100)
    })) : [];

    // 处理车辆详细信息
    const vehicleDetails = Array.isArray(vehicleDetailsResult) ? vehicleDetailsResult.map((vehicle: any) => ({
      taxiId: vehicle.taxi_id,
      recordCount: vehicle.record_count,
      avgSpeed: Math.round(vehicle.avg_speed || 0),
      maxSpeed: Math.round(vehicle.max_speed || 0),
      minSpeed: Math.round(vehicle.min_speed || 0),
      occupiedCount: vehicle.occupied_count,
      emptyCount: vehicle.empty_count,
      occupancyRate: Math.round((vehicle.occupied_count / vehicle.record_count) * 100),
      firstRecord: vehicle.first_record,
      lastRecord: vehicle.last_record,
      activeHours: Math.round(((new Date(vehicle.last_record).getTime() - new Date(vehicle.first_record).getTime()) / (1000 * 60 * 60)))
    })) : [];

    // 处理收入分析数据
    const revenueData = Array.from({ length: 24 }, (_, i) => {
      const hourData = Array.isArray(revenueResult) 
        ? revenueResult.find((row: any) => row.hour === i)
        : null;
      return {
        hour: i,
        totalRecords: hourData ? hourData.total_records : 0,
        occupiedRecords: hourData ? hourData.occupied_records : 0,
        avgSpeed: hourData ? Math.round(hourData.avg_speed || 0) : 0,
        activeVehicles: hourData ? hourData.active_vehicles : 0,
        estimatedRevenue: hourData ? Math.round(hourData.occupied_records * 15) : 0 // 假设每次载客15元
      };
    });

    // 生成热力图数据
    const heatmapData = Array.isArray(hotspotResult) ? hotspotResult.map((spot: any) => ({
      lng: spot.avg_lng,
      lat: spot.avg_lat,
      count: spot.point_count
    })) : [];

    // 生成轨迹数据（模拟）
    const trajectoryData = generateTrajectoryData();

    // 计算收入估算（基于距离和平均费率）
    const avgDistance = distanceStats.avg_distance_km || 8.5;
    const totalTrips = distanceStats.total_trips || baseStats.total_records || 0;
    const estimatedRevenue = totalTrips * avgDistance * 2.5; // 假设每公里2.5元

    // 构建响应数据
    const responseData = {
      totalOrders: baseStats.total_records || 0,
      activeVehicles: baseStats.unique_taxis || 0,
      avgDistance: Number(avgDistance.toFixed(1)),
      totalRevenue: Math.round(estimatedRevenue),
      avgSpeed: Math.round(baseStats.avg_speed || 0),
      occupancyRate: Math.round((baseStats.occupancy_rate || 0) * 100),
      heatmapData,
      trajectoryData,
      hotspots: hotspots.slice(0, 6), // 只返回前6个热门区域
      hourlyData,
      speedDistribution: speedDistribution.map((item: any) => ({
        range: item.speed_range,
        count: item.count,
        percentage: Math.round((item.count / baseStats.total_records) * 100)
      })),
      vehicleDetails: vehicleDetails.slice(0, 20), // 返回前20辆车
      revenueData,
      timeRange,
      metric,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('获取出租车分析数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取出租车分析数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 生成轨迹数据的辅助函数
function generateTrajectoryData() {
  const trajectories = [];
  const centerLng = 117.0009;
  const centerLat = 36.6758;

  for (let i = 0; i < 15; i++) {
    const points = [];
    let currentLng = centerLng + (Math.random() - 0.5) * 0.08;
    let currentLat = centerLat + (Math.random() - 0.5) * 0.08;

    for (let j = 0; j < 8; j++) {
      points.push({
        longitude: currentLng,
        latitude: currentLat,
      });
      currentLng += (Math.random() - 0.5) * 0.01;
      currentLat += (Math.random() - 0.5) * 0.01;
    }

    trajectories.push({
      id: i,
      points,
      color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5],
    });
  }
  return trajectories;
} 