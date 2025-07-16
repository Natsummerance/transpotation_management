import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import type { NextRequest } from 'next/server'

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
    'SELECT DATE(create_time) AS date, COUNT(*) AS count FROM face_store GROUP BY date ORDER BY date DESC'
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