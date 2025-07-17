import { NextRequest, NextResponse } from 'next/server';

export let registrationSessions: Record<string, { username: string; user_id: number; collected_images: number; target_images: number; status: string; start_time: number }> = {};
let totalFaceNum = 0;

/**
 * @swagger
 * /api/user/register/face/start:
 *   post:
 *     summary: 开始人脸注册会话
 *     description: 提交用户名，生成注册会话ID并初始化会话。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *     responses:
 *       200:
 *         description: 会话启动成功，返回会话ID和目标图片数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 session_id:
 *                   type: string
 *                 target_images:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: 缺少用户名
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
 *         description: 会话启动失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ success: false, message: '缺少用户名' }, { status: 400 });
    }
    // 生成会话ID
    const session_id = `reg_${Date.now()}`;
    registrationSessions[session_id] = {
      username,
      user_id: totalFaceNum,
      collected_images: 0,
      target_images: 10, // 前端可自定义
      status: 'collecting',
      start_time: Date.now()
    };
    return NextResponse.json({ success: true, session_id, target_images: 10, message: '录入会话已开始' });
  } catch (e) {
    return NextResponse.json({ success: false, message: '会话启动失败', error: String(e) }, { status: 500 });
  }
} 