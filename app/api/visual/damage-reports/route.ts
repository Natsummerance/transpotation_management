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
    where = 'WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?'
    params = [start, end]
  }

  // 1. 损坏类型分布
  const [typeRows] = await pool.execute(
    `SELECT JSON_UNQUOTE(JSON_EXTRACT(results, '$.type')) as type, COUNT(*) as count FROM damage_reports ${where} GROUP BY type`,
    params
  )
  const typeStats = Array.isArray(typeRows) ? typeRows : []

  // 2. 地理热力数据
  const [heatRows] = await pool.execute(
    `SELECT location_lat as lat, location_lng as lng FROM damage_reports ${where}`,
    params
  )
  const heatmap = Array.isArray(heatRows) ? heatRows : []

  // 3. 时间趋势
  const [trendRows] = await pool.execute(
    `SELECT DATE(timestamp) as date, COUNT(*) as count FROM damage_reports ${where} GROUP BY date ORDER BY date DESC LIMIT 30`,
    params
  )
  const timeTrend = Array.isArray(trendRows) ? trendRows : []

  // 4. 图片列表
  const [imgRows] = await pool.execute(
    `SELECT result_image as url, timestamp as time FROM damage_reports ${where ? where + ' AND' : 'WHERE'} result_image IS NOT NULL ORDER BY timestamp DESC LIMIT 20`,
    params
  )
  const images = Array.isArray(imgRows) ? imgRows : []

  return NextResponse.json({
    typeStats,
    heatmap,
    timeTrend,
    images,
  })
} 