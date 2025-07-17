import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const configDir = join(process.cwd(), 'public', 'config');
const configPath = join(configDir, 'settings.json');

/**
 * @swagger
 * /api/system/settings:
 *   get:
 *     summary: 获取系统设置
 *     description: 读取系统配置文件 settings.json，返回系统设置内容。
 *     responses:
 *       200:
 *         description: 成功返回系统设置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: 读取系统设置失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *   put:
 *     summary: 保存系统设置
 *     description: 保存系统设置到配置文件 settings.json。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 保存成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 保存系统设置失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export async function GET() {
  try {
    // 读取配置文件
    const data = await readFile(configPath, 'utf-8');
    return NextResponse.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    // 文件不存在时返回默认配置
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json({ success: true, data: {} });
    }
    return NextResponse.json({ success: false, message: '读取系统设置失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: '系统设置保存成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '保存系统设置失败' }, { status: 500 });
  }
} 