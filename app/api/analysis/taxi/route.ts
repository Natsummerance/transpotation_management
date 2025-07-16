import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

// 高德地图API配置
const AMAP_KEY = 'c6115796bfbad53bd639041995b5b123';
const AMAP_GEOCODE_URL = 'https://restapi.amap.com/v3/geocode/regeo';

// 地理编码函数 - 将GCJ02坐标转换为地址
async function getAddressFromCoordinates(lng: number, lat: number): Promise<string> {
  try {
    const response = await fetch(
      `${AMAP_GEOCODE_URL}?key=${AMAP_KEY}&location=${lng},${lat}&output=json&extensions=base`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      const formattedAddress = data.regeocode.formatted_address;
      
      // 优先返回格式化地址，如果没有则组合省市区
      if (formattedAddress) {
        return formattedAddress;
      }
      
      // 组合省市区信息
      const parts = [];
      if (addressComponent.province) parts.push(addressComponent.province);
      if (addressComponent.city) parts.push(addressComponent.city);
      if (addressComponent.district) parts.push(addressComponent.district);
      if (addressComponent.township) parts.push(addressComponent.township);
      
      return parts.join('');
    }
    
    return '未知地址';
  } catch (error) {
    console.error('地理编码失败:', error);
    return '地址解析失败';
  }
}

// 批量地理编码函数 - 带缓存和限流
const addressCache = new Map<string, string>();
const geocodeQueue: Array<{lng: number, lat: number, resolve: (address: string) => void}> = [];
let isProcessingGeocode = false;

async function processGeocodeQueue() {
  if (isProcessingGeocode || geocodeQueue.length === 0) return;
  
  isProcessingGeocode = true;
  
  while (geocodeQueue.length > 0) {
    const batch = geocodeQueue.splice(0, 10); // 每次处理10个请求
    
    await Promise.all(batch.map(async ({lng, lat, resolve}) => {
      const cacheKey = `${lng.toFixed(6)},${lat.toFixed(6)}`;
      
      if (addressCache.has(cacheKey)) {
        resolve(addressCache.get(cacheKey)!);
        return;
      }
      
      const address = await getAddressFromCoordinates(lng, lat);
      addressCache.set(cacheKey, address);
      resolve(address);
    }));
    
    // 限流：每次批量请求后等待100ms
    if (geocodeQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  isProcessingGeocode = false;
}

async function getAddressWithCache(lng: number, lat: number): Promise<string> {
  const cacheKey = `${lng.toFixed(6)},${lat.toFixed(6)}`;
  
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }
  
  return new Promise((resolve) => {
    geocodeQueue.push({lng, lat, resolve});
    processGeocodeQueue();
  });
}

export async function GET(request: NextRequest) {
  let connection: any;
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'orders';
    const timeRange = searchParams.get('timeRange') || 'today';
    const selectedPlate = searchParams.get('plate') || ''; // 新增车牌筛选参数

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
        timeCondition = "WHERE DATE(beijing_time) = '2013-09-12'";
        break;
      case 'week':
        timeCondition = "WHERE beijing_time >= '2013-09-06' AND beijing_time <= '2013-09-12'";
        break;
      case 'month':
        timeCondition = "WHERE beijing_time >= '2013-08-12' AND beijing_time <= '2013-09-12'";
        break;
      case 'year':
        timeCondition = "WHERE beijing_time >= '2012-09-12' AND beijing_time <= '2013-09-12'";
        break;
      default:
        timeCondition = "WHERE DATE(beijing_time) = '2013-09-12'";
    }

    // 添加车牌筛选条件
    if (selectedPlate) {
      timeCondition += ` AND car_plate = '${selectedPlate}'`;
    }

    // 获取可用车牌列表（用于前端筛选）
    const availablePlatesQuery = `
      SELECT DISTINCT car_plate
      FROM taxi_gps_log 
      WHERE DATE(beijing_time) = '2013-09-12'
      ORDER BY car_plate
      LIMIT 100
    `;

    // 轨迹点heading/speed导出（用于前端可视化，限制数量）
    const trajectoryPointsQuery = `
      SELECT 
        gcj02_lat, 
        gcj02_lon, 
        heading, 
        speed, 
        beijing_time,
        is_occupied,
        event_tag,
        trip_id
      FROM taxi_gps_log
      ${timeCondition}
      ORDER BY beijing_time
      LIMIT 5000
    `;

    // 上下客事件统计查询
    const passengerEventsQuery = `
      SELECT 
        event_tag,
        COUNT(*) as event_count,
        AVG(speed) as avg_speed,
        COUNT(DISTINCT car_plate) as vehicle_count
      FROM taxi_gps_log
      ${timeCondition} AND event_tag IN (1, 2, 3, 4)
      GROUP BY event_tag
      ORDER BY event_tag
      LIMIT 10000
    `;

    // 行程统计查询
    const tripStatsQuery = `
      SELECT 
        MAX(trip_id) as total_trips,
        COUNT(DISTINCT car_plate) as active_vehicles,
        AVG(speed) as avg_speed,
        SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_time,
        SUM(CASE WHEN is_occupied = 0 THEN 1 ELSE 0 END) as empty_time
      FROM taxi_gps_log
      ${timeCondition}
    `;

    // 基础统计查询
    const baseStatsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT car_plate) as unique_taxis,
        AVG(speed) as avg_speed,
        AVG(CAST(is_occupied AS UNSIGNED)) as occupancy_rate,
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
        SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_trips,
        SUM(CASE WHEN is_occupied = 0 THEN 1 ELSE 0 END) as empty_trips
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
        ROUND(gcj02_lat, 3) as lat_rounded,
        ROUND(gcj02_lon, 3) as lng_rounded,
        COUNT(*) as point_count,
        AVG(gcj02_lat) as avg_lat,
        AVG(gcj02_lon) as avg_lng,
        AVG(speed) as avg_speed,
        SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_count
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY ROUND(gcj02_lat, 3), ROUND(gcj02_lon, 3)
      HAVING point_count > 10
      ORDER BY point_count DESC
      LIMIT 20
    `;

    // 热力图原始数据查询 - 按时间分模块处理
    const heatmapRawDataQuery = `
      SELECT 
        gcj02_lat,
        gcj02_lon,
        speed,
        is_occupied,
        event_tag,
        beijing_time,
        HOUR(beijing_time) as hour,
        DATE(beijing_time) as date
      FROM taxi_gps_log 
      ${timeCondition}
      ORDER BY beijing_time
      LIMIT 10000
    `;

    // 车辆详细信息查询
    const vehicleDetailsQuery = `
      SELECT 
        car_plate,
        COUNT(*) as record_count,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed,
        SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_count,
        SUM(CASE WHEN is_occupied = 0 THEN 1 ELSE 0 END) as empty_count,
        MIN(beijing_time) as first_record,
        MAX(beijing_time) as last_record
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY car_plate
      ORDER BY record_count DESC
      LIMIT 50
    `;

    // 收入分析查询
    const revenueQuery = `
      SELECT 
        HOUR(beijing_time) as hour,
        COUNT(*) as total_records,
        SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_records,
        AVG(speed) as avg_speed,
        COUNT(DISTINCT car_plate) as active_vehicles
      FROM taxi_gps_log 
      ${timeCondition}
      GROUP BY HOUR(beijing_time)
      ORDER BY hour
    `;

    // 方向分布统计（每45度一段）
    const headingDistributionQuery = `
      SELECT 
        FLOOR(heading / 45) * 45 AS heading_bin,
        COUNT(*) AS count,
        AVG(speed) AS avg_speed
      FROM taxi_gps_log
      ${timeCondition}
      GROUP BY heading_bin
      ORDER BY heading_bin
    `;

    // 执行查询
    const [baseStatsResult] = await connection.execute(baseStatsQuery, timeParams);
    const [distanceResult] = await connection.execute(distanceQuery, timeParams);
    const [speedDistributionResult] = await connection.execute(speedDistributionQuery, timeParams);
    const [hourlyDistributionResult] = await connection.execute(hourlyDistributionQuery, timeParams);
    const [hotspotResult] = await connection.execute(hotspotQuery, timeParams);
    const [vehicleDetailsResult] = await connection.execute(vehicleDetailsQuery, timeParams);
    const [revenueResult] = await connection.execute(revenueQuery, timeParams);
    const [headingDistributionResult] = await connection.execute(headingDistributionQuery, timeParams);
    const [trajectoryPointsResult] = await connection.execute(trajectoryPointsQuery, timeParams);
    const [availablePlatesResult] = await connection.execute(availablePlatesQuery, timeParams);
    const [passengerEventsResult] = await connection.execute(passengerEventsQuery, timeParams);
    const [tripStatsResult] = await connection.execute(tripStatsQuery, timeParams);
    const [heatmapRawDataResult] = await connection.execute(heatmapRawDataQuery, timeParams);

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

    // 处理热门区域数据 - 添加地址解析
    const hotspots = [];
    if (Array.isArray(hotspotResult)) {
      for (let i = 0; i < Math.min(hotspotResult.length, 6); i++) {
        const spot = hotspotResult[i];
        const address = await getAddressWithCache(spot.avg_lng, spot.avg_lat);
        
        hotspots.push({
          rank: i + 1,
          name: address,
          orders: spot.point_count,
          growth: `+${Math.floor(Math.random() * 20 + 5)}%`,
          lat: spot.avg_lat,
          lng: spot.avg_lng,
          avgSpeed: Math.round(spot.avg_speed || 0),
          occupancyRate: Math.round((spot.occupied_count / spot.point_count) * 100)
        });
      }
    }

    // 处理车辆详细信息
    const vehicleDetails = Array.isArray(vehicleDetailsResult) ? vehicleDetailsResult.map((vehicle: any) => ({
      taxiId: vehicle.car_plate,
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

    // 处理方向分布数据
    const headingDistribution = Array.isArray(headingDistributionResult)
      ? headingDistributionResult.map((row: any) => ({
          headingBin: row.heading_bin,
          count: row.count,
          avgSpeed: Math.round(row.avg_speed || 0)
        }))
      : [];

    // 处理轨迹点数据
    const trajectoryPoints = Array.isArray(trajectoryPointsResult)
      ? trajectoryPointsResult.map((row: any) => ({
          lat: row.gcj02_lat,
          lng: row.gcj02_lon,
          heading: row.heading,
          speed: row.speed,
          time: row.beijing_time,
          isOccupied: row.is_occupied === 1,
          eventTag: row.event_tag,
          tripId: row.trip_id
        }))
      : [];

    // 处理上下客事件统计
    const passengerEvents = Array.isArray(passengerEventsResult)
      ? passengerEventsResult.map((row: any) => {
          const eventLabels = {
            1: '上客事件',
            2: '下客事件', 
            3: '持续载客',
            4: '持续空车'
          };
          return {
            eventTag: row.event_tag,
            label: eventLabels[row.event_tag as keyof typeof eventLabels] || '未知事件',
            count: row.event_count,
            avgSpeed: Math.round(row.avg_speed || 0),
            vehicleCount: row.vehicle_count
          };
        })
      : [];

    // 处理行程统计
    const tripStats = Array.isArray(tripStatsResult) ? tripStatsResult[0] as any : {};
    const totalTripCount = tripStats.total_trips || 0;
    const occupiedTime = tripStats.occupied_time || 0;
    const emptyTime = tripStats.empty_time || 0;
    const totalTime = occupiedTime + emptyTime;
    const occupancyRate = totalTime > 0 ? Math.round((occupiedTime / totalTime) * 100) : 0;

    // 处理可用车牌列表
    const availablePlates = Array.isArray(availablePlatesResult)
      ? availablePlatesResult.map((row: any) => row.car_plate)
      : [];

    // 生成热力图数据 - 按时间分模块处理
    const heatmapData: any[] = [];
    const heatmapRawData = Array.isArray(heatmapRawDataResult) ? heatmapRawDataResult : [];
    
    if (heatmapRawData.length > 0) {
      console.log(`处理 ${heatmapRawData.length} 个热力图数据点`);
      
      // 按时间分模块处理数据
      const timeModules: { [key: string]: any[] } = {};
      
      // 将数据按小时分组
      heatmapRawData.forEach((point: any) => {
        const timeKey = `${point.date}_${point.hour}`;
        if (!timeModules[timeKey]) {
          timeModules[timeKey] = [];
        }
        timeModules[timeKey].push(point);
      });
      
      console.log(`数据分为 ${Object.keys(timeModules).length} 个时间模块`);
      
      // 处理每个时间模块
      Object.keys(timeModules).forEach((timeKey, moduleIndex) => {
        const moduleData = timeModules[timeKey];
        const [date, hour] = timeKey.split('_');
        
        console.log(`处理模块 ${moduleIndex + 1}/${Object.keys(timeModules).length}: ${date} ${hour}:00 (${moduleData.length} 个数据点)`);
        
        // 对每个模块进行智能采样
        const maxPointsPerModule = 5000; // 每个模块最大点数
        const sampleRate = moduleData.length > maxPointsPerModule ? maxPointsPerModule / moduleData.length : 1;
        
        moduleData.forEach((point: any) => {
          // 智能采样：优先保留重要数据点
          let shouldInclude = true;
          
          if (sampleRate < 1) {
            // 优先保留载客、上下客、高速等重要数据点
            const isImportant = point.is_occupied === 1 || 
                               point.event_tag === 1 || 
                               point.event_tag === 2 || 
                               point.speed > 30;
            
            if (isImportant) {
              // 重要数据点100%保留
              shouldInclude = true;
            } else {
              // 普通数据点按采样率保留
              shouldInclude = Math.random() < sampleRate;
            }
          }
          
          if (shouldInclude) {
            let weight = 1; // 基础权重
            
            // 根据载客状态调整权重
            if (point.is_occupied === 1) {
              weight *= 2; // 载客状态权重更高
            }
            
            // 根据速度调整权重
            if (point.speed > 30) {
              weight *= 1.5; // 高速行驶权重更高
            } else if (point.speed < 5) {
              weight *= 1.2; // 低速/停车权重稍高
            }
            
            // 根据事件类型调整权重
            if (point.event_tag === 1 || point.event_tag === 2) {
              weight *= 2.5; // 上下客事件权重最高
            }
            
            // 添加时间模块信息
            heatmapData.push({
              lng: point.gcj02_lon,
              lat: point.gcj02_lat,
              count: weight,
              speed: point.speed,
              isOccupied: point.is_occupied === 1,
              eventTag: point.event_tag,
              time: point.beijing_time,
              date: point.date,
              hour: point.hour,
              moduleKey: timeKey
            });
          }
        });
      });
      
      console.log(`生成 ${heatmapData.length} 个热力图数据点 (原始数据: ${heatmapRawData.length})`);
    }

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
      headingDistribution,
      trajectoryPoints,
      availablePlates, // 添加可用车牌列表
      passengerEvents, // 添加上下客事件统计
      tripStats: { // 添加行程统计
        totalTrips: totalTripCount,
        occupiedTime,
        emptyTime,
        occupancyRate
      },
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