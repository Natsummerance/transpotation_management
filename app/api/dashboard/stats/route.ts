import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection: any;
  try {
    // 添加连接超时处理
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]) as any;
    
    // 1. 路面病害检测统计 - 查询今日和昨日数据
    const roadDamageQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as yesterday_count
      FROM damage_reports 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    // 2. 出租车数据分析统计 - 查询今日和昨日数据
    const taxiStatsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN DATE(beijing_time) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN DATE(beijing_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as yesterday_count
      FROM taxi_gps_log 
      WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    
    // 3. 地图时空分析统计 - 查询今日和昨日数据
    const mapAnalysisQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN DATE(beijing_time) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN DATE(beijing_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as yesterday_count
      FROM taxi_gps_log 
      WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `;
    
    // 4. 日志与事件回放统计 - 查询今日和昨日数据
    const logsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as yesterday_count
      FROM system_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    // 执行查询
    const [roadDamageResult] = await connection.execute(roadDamageQuery);
    const [taxiStatsResult] = await connection.execute(taxiStatsQuery);
    const [mapAnalysisResult] = await connection.execute(mapAnalysisQuery);
    const [logsResult] = await connection.execute(logsQuery);

    connection.release();

    // 处理结果
    const roadDamage = Array.isArray(roadDamageResult) ? roadDamageResult[0] as any : {};
    const taxiStats = Array.isArray(taxiStatsResult) ? taxiStatsResult[0] as any : {};
    const mapAnalysis = Array.isArray(mapAnalysisResult) ? mapAnalysisResult[0] as any : {};
    const logs = Array.isArray(logsResult) ? logsResult[0] as any : {};

    // 计算变化率函数
    const calculateChangeRate = (today: number, yesterday: number): string => {
      if (yesterday === 0) {
        return today > 0 ? '+100%' : '0%';
      }
      const change = ((today - yesterday) / yesterday) * 100;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${Math.round(change)}%`;
    };

    // 统计数据 - 包含趋势变化
    const stats = {
      roadDamage: {
        title: "路面病害检测",
        total: roadDamage.total_count || 0,
        today: roadDamage.today_count || 0,
        yesterday: roadDamage.yesterday_count || 0,
        roadDamages: roadDamage.total_count || 0,
        detectedDamages: roadDamage.total_count || 0,
        change: calculateChangeRate(roadDamage.today_count || 0, roadDamage.yesterday_count || 0),
        icon: "AlertTriangle",
        color: "from-red-500 to-pink-500",
        bgColor: "bg-red-50",
        textColor: "text-red-600"
      },
      taxiAnalysis: {
        title: "出租车数据分析",
        activeTaxis: taxiStats.total_count || 0,
        totalRecords: taxiStats.total_count || 0,
        occupiedTrips: taxiStats.total_count || 0,
        todayRecords: taxiStats.today_count || 0,
        yesterdayRecords: taxiStats.yesterday_count || 0,
        avgSpeed: Math.round(taxiStats.total_count || 0),
        totalTrips: taxiStats.total_count || 0,
        change: calculateChangeRate(taxiStats.today_count || 0, taxiStats.yesterday_count || 0),
        icon: "Car",
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600"
      },
      mapAnalysis: {
        title: "地图时空分析",
        vehiclesTracked: mapAnalysis.total_count || 0,
        locationPoints: mapAnalysis.total_count || 0,
        speedViolations: mapAnalysis.total_count || 0,
        eventsDetected: mapAnalysis.total_count || 0,
        todayCount: mapAnalysis.today_count || 0,
        yesterdayCount: mapAnalysis.yesterday_count || 0,
        change: calculateChangeRate(mapAnalysis.today_count || 0, mapAnalysis.yesterday_count || 0),
        icon: "MapPin",
        color: "from-orange-500 to-yellow-500",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600"
      },
      logs: {
        title: "日志与事件回放",
        totalLogs: logs.total_count || 0,
        todayLogs: logs.today_count || 0,
        yesterdayLogs: logs.yesterday_count || 0,
        errorLogs: logs.total_count || 0,
        warningLogs: logs.total_count || 0,
        infoLogs: logs.total_count || 0,
        change: calculateChangeRate(logs.today_count || 0, logs.yesterday_count || 0),
        icon: "Activity",
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50",
        textColor: "text-green-600"
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取统计数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 