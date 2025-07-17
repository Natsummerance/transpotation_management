import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: 获取车辆总数
 *     description: 读取 public/cars.txt 文件，返回车辆总数。
 *     responses:
 *       200:
 *         description: 成功返回车辆总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carCount:
 *                   type: integer
 *                   nullable: true
 *                   description: 车辆总数，解析失败时为 null
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'cars.txt');
    const content = await fs.readFile(filePath, 'utf-8');
    const carCount = parseInt(content.trim(), 10);
    return NextResponse.json({ carCount: isNaN(carCount) ? null : carCount });
  } catch (e) {
    return NextResponse.json({ carCount: null });
  }
} 