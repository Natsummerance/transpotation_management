import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     summary: 获取最新警报数据
 *     description: 获取人脸、道路危害、交通拥堵等多类型的最新警报信息。
 *     responses:
 *       200:
 *         description: 成功返回警报数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           severity:
 *                             type: string
 *                           location:
 *                             type: string
 *                           timeAgo:
 *                             type: string
 *                           status:
 *                             type: string
 *                     totalAlerts:
 *                       type: integer
 *                     newAlerts:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: 获取警报数据失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();
    
    // 获取最新的警报数据 - 简化查询
    const alertsQuery = `
      SELECT 
        id,
        'recognition_status' as type,
        '人脸警报' as title,
        '检测到未知用户' as description,
        'face_image_path' as face_image,
        'confidence_score' as severity,
        'ip_address' as location,
        created_at,
        'user_agent' as status
      FROM face_store
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    // 获取道路危害警报 - 简化查询
    const roadDamageAlertsQuery = `
      SELECT 
        id,
        'road_damage' as type,
        '道路危害警报' as title,
        '检测到道路危害' as description,
        'medium' as severity,
        '道路' as location,
        created_at,
        'active' as status
      FROM damage_reports 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND module = 'road-damage'
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    // 获取交通拥堵警报 - 简化查询
    const trafficAlertsQuery = `
      SELECT 
        id,
        'traffic_congestion' as type,
        '交通拥堵警报' as title,
        '检测到交通拥堵' as description,
        'medium' as severity,
        '道路' as location,
        beijing_time as created_at,
        'active' as status
      FROM taxi_gps_log 
      WHERE beijing_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND speed < 30
      ORDER BY beijing_time DESC 
      LIMIT 3
    `;

    // 执行查询
    const [alertsResult] = await connection.execute(alertsQuery);
    const [roadDamageAlertsResult] = await connection.execute(roadDamageAlertsQuery);
    const [trafficAlertsResult] = await connection.execute(trafficAlertsQuery);

    connection.release();

    // 合并所有警报
    const allAlerts = [
      ...(Array.isArray(roadDamageAlertsResult) ? roadDamageAlertsResult : []),
      ...(Array.isArray(trafficAlertsResult) ? trafficAlertsResult : []),
      ...(Array.isArray(alertsResult) ? alertsResult : [])
    ];

    // 按时间排序并限制数量
    const sortedAlerts = allAlerts
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        location: alert.location,
        timeAgo: getTimeAgo(new Date(alert.created_at)),
        status: alert.status
      }));

    return NextResponse.json({
      success: true,
      data: {
        alerts: sortedAlerts,
        totalAlerts: sortedAlerts.length,
        newAlerts: sortedAlerts.filter((alert: any) => alert.status === 'new').length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取警报数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取警报数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 计算时间差
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}小时前`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}天前`;
} 