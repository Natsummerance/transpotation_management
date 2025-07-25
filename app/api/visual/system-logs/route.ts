import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

/**
 * @swagger
 * /api/visual/system-logs:
 *   get:
 *     summary: 获取系统日志可视化数据
 *     description: 获取日志类型分布、级别分布、趋势、异常明细和操作用户排行。
 *     responses:
 *       200:
 *         description: 成功返回可视化数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 typeStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       log_type:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 levelStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 trend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 errorLogs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       time:
 *                         type: string
 *                       user_id:
 *                         type: integer
 *                       ip_address:
 *                         type: string
 *                 userRank:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 */
export async function GET(request: NextRequest) {
  // 1. 日志类型分布
  const [typeRows] = await pool.execute(
    'SELECT log_type, COUNT(*) AS count FROM system_logs GROUP BY log_type'
  )
  const typeStats = Array.isArray(typeRows) ? typeRows : []

  // 2. 日志级别分布
  const [levelRows] = await pool.execute(
    'SELECT level, COUNT(*) AS count FROM system_logs GROUP BY level'
  )
  const levelStats = Array.isArray(levelRows) ? levelRows : []

  // 3. 日志趋势
  const [trendRows] = await pool.execute(
    'SELECT DATE(created_at) AS date, COUNT(*) AS count FROM system_logs GROUP BY date ORDER BY date DESC'
  )
  const trend = Array.isArray(trendRows) ? trendRows : []

  // 4. 异常日志明细
  const [errorRows] = await pool.execute(
    `SELECT id, message, created_at AS time, user_id, ip_address FROM system_logs WHERE level='ERROR' ORDER BY created_at DESC LIMIT 20`
  )
  const errorLogs = Array.isArray(errorRows) ? errorRows : []

  // 5. 操作用户排行
  const [userRows] = await pool.execute(
    `SELECT u.uid AS user_id, u.uname AS name, COUNT(*) AS count
     FROM system_logs s
     JOIN user u ON s.user_id = u.uid
     GROUP BY s.user_id, u.uname
     ORDER BY count DESC
     LIMIT 10`
  )
  const userRank = Array.isArray(userRows) ? userRows : []

  return NextResponse.json({
    typeStats,
    levelStats,
    trend,
    errorLogs,
    userRank,
  })
} 