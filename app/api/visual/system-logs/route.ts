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
    where = 'WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?'
    params = [start, end]
  }

  // 1. 日志类型分布
  const [typeRows] = await pool.execute(
    `SELECT log_type as type, COUNT(*) as count FROM system_logs ${where} GROUP BY log_type`,
    params
  )
  const typeStats = Array.isArray(typeRows) ? typeRows : []

  // 2. 日志级别分布
  const [levelRows] = await pool.execute(
    `SELECT level, COUNT(*) as count FROM system_logs ${where} GROUP BY level`,
    params
  )
  const levelStats = Array.isArray(levelRows) ? levelRows : []

  // 3. 日志时间趋势
  const [trendRows] = await pool.execute(
    `SELECT DATE(created_at) as date, COUNT(*) as count FROM system_logs ${where} GROUP BY date ORDER BY date DESC LIMIT 30`,
    params
  )
  const timeTrend = Array.isArray(trendRows) ? trendRows : []

  // 4. 用户操作排行
  const [userRows] = await pool.execute(
    `SELECT u.uid as user_id, u.uname as name, COUNT(*) as count
     FROM system_logs s
     JOIN user u ON s.user_id = u.uid
     ${where}
     GROUP BY s.user_id, u.uname
     ORDER BY count DESC
     LIMIT 10`,
    params
  )
  const userRank = Array.isArray(userRows) ? userRows : []

  // 5. 异常日志明细
  const [errorRows] = await pool.execute(
    `SELECT id, message, created_at as time FROM system_logs ${where ? where + ' AND' : 'WHERE'} level="ERROR" ORDER BY created_at DESC LIMIT 20`,
    params
  )
  const errorLogs = Array.isArray(errorRows) ? errorRows : []

  return NextResponse.json({
    typeStats,
    levelStats,
    timeTrend,
    userRank,
    errorLogs,
  })
} 