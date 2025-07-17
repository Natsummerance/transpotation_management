import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: 获取系统日志
 *     description: 支持多条件筛选、分页、导出，返回系统、登录、病害、永红扫脸等日志。
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: all
 *         description: 日志类型（如 all、系统、登录、路面病害、永红扫脸等）
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 关键字搜索
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: export
 *         schema:
 *           type: boolean
 *         description: 是否导出为CSV
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 起始时间（ISO格式）
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间（ISO格式）
 *     responses:
 *       200:
 *         description: 成功返回日志数据
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     stats:
 *                       type: object
 *                       properties:
 *                         serious:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                         info:
 *                           type: integer
 *                         playable:
 *                           type: integer
 *       500:
 *         description: 获取日志数据失败
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
  let connection: any;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isExport = searchParams.get('export') === 'true';
    const offset = (page - 1) * limit;
    // 新增时间筛选参数
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    connection = await pool.getConnection();

    // 构建搜索条件
    let searchCondition = '';
    let searchParams1: any[] = [];
    let searchParams2: any[] = [];
    let searchParams3: any[] = [];
    
    if (search) {
      searchCondition = 'AND (message LIKE ? OR user LIKE ? OR ip LIKE ?)';
      const searchPattern = `%${search}%`;
      searchParams1 = [searchPattern, searchPattern, searchPattern];
      searchParams2 = [searchPattern, searchPattern, searchPattern];
      searchParams3 = [searchPattern, searchPattern, searchPattern];
    }

    // 时间筛选条件
    let timeConditionLogin = '';
    let timeConditionDamage = '';
    let timeConditionSystem = '';
    let timeParamsLogin: any[] = [];
    let timeParamsDamage: any[] = [];
    let timeParamsSystem: any[] = [];
    if (start && end) {
      timeConditionLogin = ' AND ll.login_time BETWEEN ? AND ?';
      timeConditionDamage = ' AND dr.created_at BETWEEN ? AND ?';
      timeConditionSystem = ' AND sl.created_at BETWEEN ? AND ?';
      timeParamsLogin = [start, end];
      timeParamsDamage = [start, end];
      timeParamsSystem = [start, end];
    }

    // 登录日志查询
    let loginLogsQuery = `
      SELECT 
        ll.log_id as id,
        ll.login_time as time,
        CASE 
          WHEN ll.login_type = 'face' THEN '人脸识别'
          ELSE '系统登录'
        END as type,
        CASE 
          WHEN ll.login_status = 0 THEN '警告'
          ELSE '信息'
        END as level,
        CASE 
          WHEN ll.login_status = 0 THEN CONCAT('登录失败 - ', COALESCE(u.uname, '未知用户'))
          ELSE CONCAT('登录成功 - ', COALESCE(u.uname, '未知用户'))
        END as message,
        COALESCE(u.uname, '未知用户') as user,
        ll.login_address as ip,
        false as hasVideo,
        NULL as face_image,
        NULL as result_image,
        'login_log' as source,
        CASE 
          WHEN ll.login_type = 'face' THEN '人脸识别'
          ELSE '系统登录'
        END as log_type
      FROM login_log ll
      LEFT JOIN user u ON ll.uid = u.uid
      LEFT JOIN face_store fs ON ll.log_id = fs.id
      WHERE 1=1
      ${timeConditionLogin}
    `;

    // 路面病害日志查询
    let damageLogsQuery = `
      SELECT 
        dr.id,
        dr.created_at as time,
        '路面病害' as type,
        CASE 
          WHEN JSON_EXTRACT(dr.results, '$."D40坑洼".count') > 0 THEN '严重'
          WHEN JSON_EXTRACT(dr.results, '$."D20龟裂".count') > 0 THEN '警告'
          WHEN JSON_EXTRACT(dr.results, '$."D1横向裂缝".count') > 0 OR JSON_EXTRACT(dr.results, '$."D0纵向裂缝".count') > 0 THEN '信息'
          ELSE '信息'
        END as level,
        CONCAT('路面病害检测 - ', 
          CASE 
            WHEN JSON_EXTRACT(dr.results, '$."D40坑洼".count') > 0 THEN 
              CONCAT('坑洼(', JSON_EXTRACT(dr.results, '$."D40坑洼".count'), '处)')
            WHEN JSON_EXTRACT(dr.results, '$."D20龟裂".count') > 0 THEN 
              CONCAT('龟裂(', JSON_EXTRACT(dr.results, '$."D20龟裂".count'), '处)')
            WHEN JSON_EXTRACT(dr.results, '$."D1横向裂缝".count') > 0 THEN 
              CONCAT('横向裂缝(', JSON_EXTRACT(dr.results, '$."D1横向裂缝".count'), '处)')
            WHEN JSON_EXTRACT(dr.results, '$."D0纵向裂缝".count') > 0 THEN 
              CONCAT('纵向裂缝(', JSON_EXTRACT(dr.results, '$."D0纵向裂缝".count'), '处)')
            ELSE '未检测到病害'
          END,
          ' - 置信度: ',
          CASE 
            WHEN JSON_EXTRACT(dr.results, '$."D40坑洼".count') > 0 THEN 
              CONCAT(ROUND(JSON_EXTRACT(dr.results, '$."D40坑洼".confidence') * 100, 1), '%')
            WHEN JSON_EXTRACT(dr.results, '$."D20龟裂".count') > 0 THEN 
              CONCAT(ROUND(JSON_EXTRACT(dr.results, '$."D20龟裂".confidence') * 100, 1), '%')
            WHEN JSON_EXTRACT(dr.results, '$."D1横向裂缝".count') > 0 THEN 
              CONCAT(ROUND(JSON_EXTRACT(dr.results, '$."D1横向裂缝".confidence') * 100, 1), '%')
            WHEN JSON_EXTRACT(dr.results, '$."D0纵向裂缝".count') > 0 THEN 
              CONCAT(ROUND(JSON_EXTRACT(dr.results, '$."D0纵向裂缝".confidence') * 100, 1), '%')
            ELSE '0%'
          END
        ) as message,
        '系统' as user,
        CONCAT(dr.location_lat, ',', dr.location_lng) as ip,
        false as hasVideo,
        NULL as face_image,
        dr.result_image,
        'damage_reports' as source,
        '路面病害' as log_type
      FROM damage_reports dr
      WHERE 1=1
      ${timeConditionDamage}
    `;

    // 系统日志查询
    let systemLogsQuery = `
      SELECT 
        sl.id,
        sl.created_at as time,
        '系统' as type,
        sl.level,
        sl.message,
        COALESCE(u.uname, '系统') as user,
        sl.ip_address as ip,
        false as hasVideo,
        NULL as face_image,
        NULL as result_image,
        'system_logs' as source,
        '系统' as log_type
      FROM system_logs sl
      LEFT JOIN user u ON sl.user_id = u.uid
      WHERE 1=1
      ${timeConditionSystem}
    `;

    let faceStoreParams: any[] = [];
    // 永红扫脸日志查询（根据新表结构）
    let faceStoreLogsQuery = `
      SELECT 
        fs.id,
        fs.created_at as time,
        '永红扫脸' as type,
        '信息' as level,
        CONCAT('永红扫脸数据采集，置信度：', IFNULL(fs.confidence_score, '无'), '，识别状态：', IFNULL(fs.recognition_status, '未知')) as message,
        '未知用户' as user,
        IFNULL(fs.ip_address, '') as ip,
        true as hasVideo,
        fs.face_image_path as face_image,
        NULL as result_image,
        'face_store' as source,
        '系统' as log_type
      FROM face_store fs
      WHERE 1=1
    `;
    if (start && end) {
      faceStoreLogsQuery += ' AND fs.created_at BETWEEN ? AND ?';
      faceStoreParams = [start, end];
    } else if (start) {
      faceStoreLogsQuery += ' AND fs.created_at >= ?';
      faceStoreParams = [start];
    } else if (end) {
      faceStoreLogsQuery += ' AND fs.created_at <= ?';
      faceStoreParams = [end];
    }

    // 添加类型筛选
    let loginParams = [...timeParamsLogin, ...searchParams1];
    let damageParams = [...timeParamsDamage, ...searchParams2];
    let systemParams = [...timeParamsSystem, ...searchParams3];
    
    if (type !== 'all') {
      if (type === '人脸识别') {
        loginLogsQuery += ` AND ll.login_type = 'face'`;
        damageLogsQuery += ` AND 1=0`; // 排除路面病害
        systemLogsQuery += ` AND 1=0`; // 排除系统日志
        faceStoreLogsQuery += ` AND 1=0`; // 排除永红扫脸
      } else if (type === '系统登录') {
        loginLogsQuery += ` AND ll.login_type != 'face'`;
        damageLogsQuery += ` AND 1=0`;
        systemLogsQuery += ` AND 1=0`;
        faceStoreLogsQuery += ` AND 1=0`;
      } else if (type === '路面病害') {
        loginLogsQuery += ` AND 1=0`;
        systemLogsQuery += ` AND 1=0`;
        faceStoreLogsQuery += ` AND 1=0`;
      } else if (type === '系统') {
        loginLogsQuery += ` AND 1=0`;
        damageLogsQuery += ` AND 1=0`;
        // 系统日志和永红扫脸都保留
      } else if (type === '永红扫脸') {
        loginLogsQuery += ` AND 1=0`;
        damageLogsQuery += ` AND 1=0`;
        systemLogsQuery += ` AND 1=0`;
        // 只保留永红扫脸
      } else {
        // 其他类型，排除所有
        loginLogsQuery += ` AND 1=0`;
        damageLogsQuery += ` AND 1=0`;
        systemLogsQuery += ` AND 1=0`;
        faceStoreLogsQuery += ` AND 1=0`;
      }
    }

    // 添加搜索条件
    if (search) {
      loginLogsQuery += searchCondition;
      damageLogsQuery += searchCondition;
      systemLogsQuery += searchCondition;
      faceStoreLogsQuery += searchCondition;
    }

    // 合并查询
    const unionQuery = `
      (
        ${loginLogsQuery}
      )
      UNION ALL
      (
        ${damageLogsQuery}
      )
      UNION ALL
      (
        ${systemLogsQuery}
      )
      UNION ALL
      (
        ${faceStoreLogsQuery}
      )
      ORDER BY time DESC
      ${!isExport ? `LIMIT ${limit} OFFSET ${offset}` : ''}
    `;

    // 统计查询 - 简化版本
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN level = '严重' THEN 1 ELSE 0 END) as serious,
        SUM(CASE WHEN level = '警告' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN level = '信息' THEN 1 ELSE 0 END) as info,
        SUM(CASE WHEN hasVideo = true THEN 1 ELSE 0 END) as playable
      FROM (
        (
          ${loginLogsQuery}
        )
        UNION ALL
        (
          ${damageLogsQuery}
        )
        UNION ALL
        (
          ${systemLogsQuery}
        )
        UNION ALL
        (
          ${faceStoreLogsQuery}
        )
      ) as all_logs
    `;

    // 总数查询
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        (
          ${loginLogsQuery}
        )
        UNION ALL
        (
          ${damageLogsQuery}
        )
        UNION ALL
        (
          ${systemLogsQuery}
        )
        UNION ALL
        (
          ${faceStoreLogsQuery}
        )
      ) as all_logs
    `;

    const allParams = [...loginParams, ...damageParams, ...systemParams, ...faceStoreParams];

    if (isExport) {
      // 导出功能
      const [logs] = await connection.execute(unionQuery, allParams);
      
      // 生成CSV内容
      const csvHeader = '时间,类型,级别,消息,用户,操作地址\n';
      const csvContent = logs.map((log: any) => 
        `"${new Date(log.time).toLocaleString('zh-CN')}","${log.type}","${log.level}","${log.message}","${log.user}","${log.ip}"`
      ).join('\n');
      
      const csv = csvHeader + csvContent;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // 执行查询
    const [logs] = await connection.execute(unionQuery, allParams);
    const [statsResult] = await connection.execute(statsQuery, [...loginParams, ...damageParams, ...systemParams, ...faceStoreParams]);
    const [countResult] = await connection.execute(countQuery, [...loginParams, ...damageParams, ...systemParams, ...faceStoreParams]);

    const stats = Array.isArray(statsResult) ? statsResult[0] as any : { serious: 0, warning: 0, info: 0, playable: 0 };
    const total = Array.isArray(countResult) ? (countResult[0] as any).total : 0;

    connection.release();

    // 高德API逆地理编码
    async function getLocationDesc(latlng: string): Promise<string> {
      if (!latlng || !latlng.includes(',')) return '';
      const key = 'c6115796bfbad53bd639041995b5b123';
      const url = `https://restapi.amap.com/v3/geocode/regeo?location=${latlng}&key=${key}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        return data?.regeocode?.formatted_address || '';
      } catch {
        return '';
      }
    }
    // 并发处理所有日志的地理位置
    const logsWithLocation = await Promise.all(
      logs.map(async (log: any) => {
        let location = '';
        // 仅对经纬度格式进行逆地理编码
        if (log.ip && /^-?\d+\.\d+,-?\d+\.\d+$/.test(log.ip)) {
          location = await getLocationDesc(log.ip);
        }
        return { ...log, location };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        logs: logsWithLocation,
        total: total,
        page: page,
        limit: limit,
        stats: {
          serious: stats.serious || 0,
          warning: stats.warning || 0,
          info: stats.info || 0,
          playable: stats.playable || 0
        }
      }
    });

  } catch (error) {
    console.error('获取日志数据失败:', error);
    if (connection) {
      connection.release();
    }
    return NextResponse.json(
      { 
        success: false, 
        error: '获取日志数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}