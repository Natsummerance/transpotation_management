import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/visual/taxi-gps:
 *   get:
 *     summary: 获取出租车GPS可视化数据
 *     description: 获取最新车辆轨迹、热力点、24小时载客分布、速度分布、事件类型分布、高峰时段和运营排行。
 *     responses:
 *       200:
 *         description: 成功返回可视化数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 track:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       car_plate:
 *                         type: string
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                       time:
 *                         type: string
 *                 heatmap:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                 hourlyStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                       occupied:
 *                         type: integer
 *                       empty:
 *                         type: integer
 *                 speedList:
 *                   type: array
 *                   items:
 *                     type: number
 *                 eventStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event_tag:
 *                         type: integer
 *                       count:
 *                         type: integer
 *                 peakStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                       count:
 *                         type: integer
 *                 topCars:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       car_plate:
 *                         type: string
 *                       trip_count:
 *                         type: integer
 */
export async function GET(request: NextRequest) {
  // 1. 最新一辆车当天轨迹
  const [trackRows] = await pool.execute(
    `SELECT car_plate, gcj02_lat AS lat, gcj02_lon AS lng, beijing_time AS time
     FROM taxi_gps_log
     WHERE car_plate = (SELECT car_plate FROM taxi_gps_log ORDER BY beijing_time DESC LIMIT 1)
       AND DATE(beijing_time) = CURDATE()
     ORDER BY beijing_time`
  )
  const track = Array.isArray(trackRows) ? trackRows : []

  // 2. 全车热力点
  const [heatRows] = await pool.execute(
    `SELECT gcj02_lat AS lat, gcj02_lon AS lng FROM taxi_gps_log WHERE DATE(beijing_time) = CURDATE()`
  )
  const heatmap = Array.isArray(heatRows) ? heatRows : []

  // 3. 24小时载客/空载分布
  const [hourRows] = await pool.execute(
    `SELECT HOUR(beijing_time) AS hour,
            SUM(is_occupied=1) AS occupied,
            SUM(is_occupied=0) AS \`empty\`
     FROM taxi_gps_log
     WHERE DATE(beijing_time) = CURDATE()
     GROUP BY hour
     ORDER BY hour`
  )
  const hourlyStatus = Array.isArray(hourRows) ? hourRows : []

  // 4. 速度分布
  const [speedRows] = await pool.execute(
    `SELECT speed FROM taxi_gps_log WHERE speed IS NOT NULL AND DATE(beijing_time) = CURDATE()`
  )
  const speedList = Array.isArray(speedRows) ? speedRows.map((r: any) => r.speed) : []

  // 5. 事件类型分布
  const [eventRows] = await pool.execute(
    `SELECT event_tag, COUNT(*) AS count FROM taxi_gps_log WHERE DATE(beijing_time) = CURDATE() GROUP BY event_tag`
  )
  const eventStats = Array.isArray(eventRows) ? eventRows : []

  // 6. 高峰时段
  const [peakRows] = await pool.execute(
    `SELECT HOUR(beijing_time) AS hour, COUNT(*) AS count
     FROM taxi_gps_log
     WHERE is_occupied=1 AND DATE(beijing_time) = CURDATE()
     GROUP BY hour
     ORDER BY hour`
  )
  const peakStats = Array.isArray(peakRows) ? peakRows : []

  // 7. 运营排行
  const [topRows] = await pool.execute(
    `SELECT car_plate, COUNT(*) AS trip_count
     FROM taxi_gps_log
     WHERE is_occupied=1 AND DATE(beijing_time) = CURDATE()
     GROUP BY car_plate
     ORDER BY trip_count DESC
     LIMIT 10`
  )
  const topCars = Array.isArray(topRows) ? topRows : []

  return NextResponse.json({
    track,
    heatmap,
    hourlyStatus,
    speedList,
    eventStats,
    peakStats,
    topCars,
  })
} 