import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: 获取天气数据
 *     description: 根据时间范围查询天气信息。
 *     parameters:
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *         required: true
 *         description: 起始时间（格式：YYYY-MM-DD HH:mm:ss）
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *         required: true
 *         description: 结束时间（格式：YYYY-MM-DD HH:mm:ss）
 *     responses:
 *       200:
 *         description: 成功返回天气数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weather:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time_new:
 *                         type: string
 *                       temperature:
 *                         type: number
 *                       wind_speed:
 *                         type: number
 *                       precip:
 *                         type: number
 *                       Humidity:
 *                         type: number
 *       400:
 *         description: 缺少时间参数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: 查询失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start_time = searchParams.get('start_time');
  const end_time = searchParams.get('end_time');

  if (!start_time || !end_time) {
    return NextResponse.json({ error: 'Missing start_time or end_time' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT time_new, temperature, wind_speed, precip, Humidity FROM taxi_weather_flow WHERE time_new BETWEEN ? AND ? ORDER BY time_new ASC`,
      [start_time, end_time]
    );
    return NextResponse.json({ weather: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 