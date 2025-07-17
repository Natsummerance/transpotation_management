import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

/**
 * @swagger
 * /api/visual/user:
 *   get:
 *     summary: 获取用户可视化数据
 *     description: 获取注册趋势、角色分布、状态分布和来源分布。
 *     responses:
 *       200:
 *         description: 成功返回可视化数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 regTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 roleStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 statusStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 sourceStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                       count:
 *                         type: integer
 */
export async function GET(request: NextRequest) {
  // 1. 注册趋势
  const [regRows] = await pool.execute(
    'SELECT DATE(create_at) AS date, COUNT(*) AS count FROM user GROUP BY date ORDER BY date DESC'
  )
  const regTrend = Array.isArray(regRows) ? regRows : []

  // 2. 角色分布
  const [roleRows] = await pool.execute(
    'SELECT role, COUNT(*) AS count FROM user GROUP BY role'
  )
  const roleStats = Array.isArray(roleRows) ? roleRows : []

  // 3. 状态分布
  const [statusRows] = await pool.execute(
    `SELECT CASE status WHEN 1 THEN '正常' ELSE '禁用' END AS status, COUNT(*) AS count FROM user GROUP BY status`
  )
  const statusStats = Array.isArray(statusRows) ? statusRows : []

  // 4. 来源分布（邮箱后缀）
  const [sourceRows] = await pool.execute(
    `SELECT SUBSTRING_INDEX(email, '@', -1) AS source, COUNT(*) AS count FROM user WHERE email IS NOT NULL GROUP BY source`
  )
  const sourceStats = Array.isArray(sourceRows) ? sourceRows : []

  return NextResponse.json({
    regTrend,
    roleStats,
    statusStats,
    sourceStats,
  })
} 