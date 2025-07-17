import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

/**
 * @swagger
 * /api/visual/face-login:
 *   get:
 *     summary: 获取人脸登录可视化数据
 *     description: 获取登录方式分布、登录趋势、人脸识别失败率趋势和活跃用户排行。
 *     responses:
 *       200:
 *         description: 成功返回可视化数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loginTypeStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       login_type:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 loginStatusTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       success:
 *                         type: integer
 *                       fail:
 *                         type: integer
 *                 faceFailTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 userActiveRank:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 */
export async function GET(request: NextRequest) {
  // 1. 登录方式分布
  const [loginTypeRows] = await pool.execute(
    'SELECT login_type, COUNT(*) AS count FROM login_log GROUP BY login_type'
  )
  const loginTypeStats = Array.isArray(loginTypeRows) ? loginTypeRows : []

  // 2. 登录成功/失败趋势
  const [loginStatusRows] = await pool.execute(
    `SELECT DATE(login_time) AS date,
            SUM(login_status=1) AS success,
            SUM(login_status=0) AS fail
     FROM login_log
     GROUP BY date
     ORDER BY date DESC`
  )
  const loginStatusTrend = Array.isArray(loginStatusRows) ? loginStatusRows : []

  // 3. 人脸识别失败率趋势
  const [faceFailRows] = await pool.execute(
    'SELECT DATE(create_at) AS date, COUNT(*) AS count FROM face_store GROUP BY date ORDER BY date DESC'
  )
  const faceFailTrend = Array.isArray(faceFailRows) ? faceFailRows : []

  // 4. 活跃用户排行
  const [userActiveRows] = await pool.execute(
    `SELECT u.uid, u.uname AS name, COUNT(*) AS count
     FROM login_log l
     JOIN user u ON l.uid = u.uid
     WHERE l.login_status=1
     GROUP BY l.uid, u.uname
     ORDER BY count DESC
     LIMIT 10`
  )
  const userActiveRank = Array.isArray(userActiveRows) ? userActiveRows : []

  return NextResponse.json({
    loginTypeStats,
    loginStatusTrend,
    faceFailTrend,
    userActiveRank,
  })
} 