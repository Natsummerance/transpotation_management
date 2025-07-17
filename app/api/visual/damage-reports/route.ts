import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

/**
 * @swagger
 * /api/visual/damage-reports:
 *   get:
 *     summary: 获取路面病害可视化数据
 *     description: 获取所有损坏点经纬度、类型分布、上报趋势和最新损坏图片。
 *     responses:
 *       200:
 *         description: 成功返回可视化数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                 typeStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
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
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       time:
 *                         type: string
 */
export async function GET(request: NextRequest) {
  // 1. 所有损坏点经纬度
  const [pointRows] = await pool.execute(
    'SELECT location_lat AS lat, location_lng AS lng FROM damage_reports'
  )
  const points = Array.isArray(pointRows) ? pointRows : []

  // 2. 损坏类型分布
  const [typeRows] = await pool.execute(
    `SELECT JSON_UNQUOTE(JSON_EXTRACT(results, '$.type')) AS type, COUNT(*) AS count FROM damage_reports GROUP BY type`
  )
  const typeStats = Array.isArray(typeRows) ? typeRows : []

  // 3. 损坏上报趋势
  const [trendRows] = await pool.execute(
    'SELECT DATE(timestamp) AS date, COUNT(*) AS count FROM damage_reports GROUP BY date ORDER BY date DESC'
  )
  const trend = Array.isArray(trendRows) ? trendRows : []

  // 4. 最新损坏图片
  const [imgRows] = await pool.execute(
    'SELECT result_image AS url, timestamp AS time FROM damage_reports WHERE result_image IS NOT NULL ORDER BY timestamp DESC LIMIT 20'
  )
  const images = Array.isArray(imgRows) ? imgRows : []

  return NextResponse.json({
    points,
    typeStats,
    trend,
    images,
  })
} 