import { NextResponse } from "next/server"

/**
 * @swagger
 * /api/system/status:
 *   get:
 *     summary: 获取系统运行状态
 *     description: 返回系统运行状态、CPU、内存、运行时长等信息。
 *     responses:
 *       200:
 *         description: 成功返回系统状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 cpu:
 *                   type: number
 *                   description: CPU使用率（%）
 *                 memory:
 *                   type: number
 *                   description: 内存使用率（%）
 *                 uptime:
 *                   type: integer
 *                   description: 运行时长（秒）
 *                 timestamp:
 *                   type: integer
 *                   description: 时间戳（毫秒）
 */
// Fake system metrics – replace with real data source when available
export async function GET() {
  return NextResponse.json({
    status: "ok",
    cpu: 42, // %
    memory: 63, // %
    uptime: 3_600, // seconds
    timestamp: Date.now(),
  })
}
