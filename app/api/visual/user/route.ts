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
    where = 'WHERE DATE(create_at) >= ? AND DATE(create_at) <= ?'
    params = [start, end]
  }

  // 1. 注册趋势
  const [regRows] = await pool.execute(
    `SELECT DATE(create_at) as date, COUNT(*) as count FROM user ${where} GROUP BY date ORDER BY date DESC LIMIT 30`,
    params
  )
  const regTrend = Array.isArray(regRows) ? regRows : []

  // 2. 角色分布
  const [roleRows] = await pool.execute(
    `SELECT role, COUNT(*) as count FROM user ${where} GROUP BY role`,
    params
  )
  const roleStats = Array.isArray(roleRows) ? roleRows : []

  // 3. 状态分布
  const [statusRows] = await pool.execute(
    `SELECT CASE status WHEN 1 THEN '正常' ELSE '禁用' END as status, COUNT(*) as count FROM user ${where} GROUP BY status`,
    params
  )
  const statusStats = Array.isArray(statusRows) ? statusRows : []

  // 4. 来源分布（邮箱后缀）
  const [sourceRows] = await pool.execute(
    `SELECT SUBSTRING_INDEX(email, '@', -1) as source, COUNT(*) as count FROM user ${where ? where + ' AND' : 'WHERE'} email IS NOT NULL GROUP BY source`,
    params
  )
  const sourceStats = Array.isArray(sourceRows) ? sourceRows : []

  return NextResponse.json({
    regTrend,
    roleStats,
    statusStats,
    sourceStats,
  })
} 