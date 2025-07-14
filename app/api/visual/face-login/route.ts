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
    where = 'WHERE DATE(login_time) >= ? AND DATE(login_time) <= ?'
    params = [start, end]
  }

  // 1. 登录方式分布
  const [loginTypeRows] = await pool.execute(
    `SELECT login_type as type, COUNT(*) as count FROM login_log ${where} GROUP BY login_type`,
    params
  )
  const loginTypeStats = Array.isArray(loginTypeRows) ? loginTypeRows : []

  // 2. 登录成功/失败趋势
  const [loginStatusRows] = await pool.execute(
    `SELECT DATE(login_time) as date,
      SUM(login_status=1) as success,
      SUM(login_status=0) as fail
     FROM login_log ${where} GROUP BY date ORDER BY date DESC LIMIT 30`,
    params
  )
  const loginStatusTrend = Array.isArray(loginStatusRows) ? loginStatusRows : []

  // 3. 人脸识别失败趋势
  let faceWhere = ''
  let faceParams: any[] = []
  if (start && end) {
    faceWhere = 'WHERE DATE(create_time) >= ? AND DATE(create_time) <= ?'
    faceParams = [start, end]
  }
  const [faceFailRows] = await pool.execute(
    `SELECT DATE(create_time) as date, COUNT(*) as count FROM face_store ${faceWhere} GROUP BY date ORDER BY date DESC LIMIT 30`,
    faceParams
  )
  const faceFailTrend = Array.isArray(faceFailRows) ? faceFailRows : []

  // 4. 用户活跃度排行
  const [userActiveRows] = await pool.execute(
    `SELECT u.uid, u.uname as name, COUNT(*) as count
     FROM login_log l
     JOIN user u ON l.uid = u.uid
     ${where}
     AND l.login_status=1
     GROUP BY l.uid, u.uname
     ORDER BY count DESC
     LIMIT 10`,
    params
  )
  const userActiveRank = Array.isArray(userActiveRows) ? userActiveRows : []

  return NextResponse.json({
    loginTypeStats,
    loginStatusTrend,
    faceFailTrend,
    userActiveRank,
  })
} 