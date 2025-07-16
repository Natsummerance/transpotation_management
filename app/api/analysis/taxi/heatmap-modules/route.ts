import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let connection: any;
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'today';
    const selectedPlate = searchParams.get('plate') || '';
    const moduleKey = searchParams.get('moduleKey') || ''; // 时间模块键
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10000');

    // 添加连接超时处理
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
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

    // 添加时间模块筛选条件
    if (moduleKey) {
      const [date, hour] = moduleKey.split('_');
      timeCondition += ` AND DATE(beijing_time) = '${date}' AND HOUR(beijing_time) = ${hour}`;
    }

    // 获取时间模块列表
    const modulesQuery = `
      SELECT 
        DATE(beijing_time) as date,
        HOUR(beijing_time) as hour,
        COUNT(*) as point_count,
        SUM(CASE WHEN is_occupied = 1 THEN 1 ELSE 0 END) as occupied_count,
        AVG(speed) as avg_speed
      FROM taxi_gps_log 
      ${timeCondition.replace(/AND DATE\(beijing_time\) = '[^']+' AND HOUR\(beijing_time\) = \d+/, '')}
      GROUP BY DATE(beijing_time), HOUR(beijing_time)
      ORDER BY date, hour
    `;

    // 获取指定模块的热力图数据
    const heatmapDataQuery = `
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
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;

    // 执行查询
    const [modulesResult] = await connection.execute(modulesQuery, timeParams);
    const [heatmapDataResult] = await connection.execute(heatmapDataQuery, timeParams);

    connection.release();

    // 处理时间模块列表
    const modules = Array.isArray(modulesResult) ? modulesResult.map((row: any) => ({
      key: `${row.date}_${row.hour}`,
      date: row.date,
      hour: row.hour,
      pointCount: row.point_count,
      occupiedCount: row.occupied_count,
      avgSpeed: Math.round(row.avg_speed || 0),
      label: `${row.date} ${row.hour.toString().padStart(2, '0')}:00`
    })) : [];

    // 处理热力图数据
    const heatmapData: any[] = [];
    const heatmapRawData = Array.isArray(heatmapDataResult) ? heatmapDataResult : [];
    
    if (heatmapRawData.length > 0) {
      console.log(`加载模块 ${moduleKey} 的 ${heatmapRawData.length} 个数据点`);
      
      heatmapRawData.forEach((point: any) => {
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
          moduleKey: `${point.date}_${point.hour}`
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        modules,
        heatmapData,
        currentModule: moduleKey,
        page,
        pageSize,
        hasMore: heatmapData.length === pageSize
      }
    });

  } catch (error) {
    console.error('获取热力图模块数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取热力图模块数据失败',
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