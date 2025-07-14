import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  let where = ''
  let params: any[] = []
  if (start && end) {
    where = 'WHERE DATE(beijing_time) >= ? AND DATE(beijing_time) <= ?'
    params = [start, end]
  } else {
    where = 'WHERE DATE(beijing_time) = CURDATE()'
  }

  // 1. 轨迹（取最新一辆车一天的轨迹）
  const [trackRows] = await pool.execute(
    `SELECT car_plate, gcj02_lat as lat, gcj02_lon as lng, beijing_time as time
     FROM taxi_gps_log
     WHERE car_plate = (SELECT car_plate FROM taxi_gps_log ORDER BY beijing_time DESC LIMIT 1)
       AND DATE(beijing_time) = CURDATE()
     ORDER BY beijing_time`
  )
  const track = Array.isArray(trackRows) ? trackRows : []

  // 2. 热力图
  const [heatRows] = await pool.execute(
    `SELECT gcj02_lat as lat, gcj02_lon as lng FROM taxi_gps_log ${where}`,
    params
  )
  const heatmap = Array.isArray(heatRows) ? heatRows : []

  // 3. 载客状态分布
  const [occRows] = await pool.execute(
    `SELECT CASE is_occupied WHEN 1 THEN '载客' ELSE '空载' END as status, COUNT(*) as count
     FROM taxi_gps_log ${where} GROUP BY is_occupied`,
    params
  )
  const occupiedStats = Array.isArray(occRows) ? occRows : []

  // 4. 速度分布
  const [speedRows] = await pool.execute(
    `SELECT speed FROM taxi_gps_log ${where} AND speed IS NOT NULL`,
    params
  )
  const speedStats = Array.isArray(speedRows) ? speedRows.map((r: any) => r.speed) : []

  // 5. 事件分布
  const [eventRows] = await pool.execute(
    `SELECT event_tag as event, COUNT(*) as count FROM taxi_gps_log ${where} GROUP BY event_tag`,
    params
  )
  const eventStats = Array.isArray(eventRows) ? eventRows : []

  // 6. 运营高峰
  const [peakRows] = await pool.execute(
    `SELECT HOUR(beijing_time) as hour, COUNT(*) as count
     FROM taxi_gps_log ${where} AND is_occupied=1
     GROUP BY hour`,
    params
  )
  const peakStats = Array.isArray(peakRows) ? peakRows : []

  // 7. 里程排行（近一天，按车牌分组，假设有distance字段，否则可用点间距估算）
  let mileageRank: any[] = []
  try {
    const [mileageRows] = await pool.execute(
      `SELECT car_plate, SUM(speed) as mileage
       FROM taxi_gps_log ${where}
       GROUP BY car_plate
       ORDER BY mileage DESC
       LIMIT 10`,
      params
    )
    mileageRank = Array.isArray(mileageRows) ? mileageRows : []
  } catch (e) {
    mileageRank = []
  }

  return NextResponse.json({
    track,
    heatmap,
    occupiedStats,
    speedStats,
    eventStats,
    peakStats,
    mileageRank,
  })
} 