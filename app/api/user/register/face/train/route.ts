import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { registrationSessions } from '../start/route';
import fs from 'fs';
import path from 'path';

function moveAllFiles(srcDir: string, destDir: string) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(srcDir)) return;
  for (const file of fs.readdirSync(srcDir)) {
    fs.renameSync(path.join(srcDir, file), path.join(destDir, file));
  }
}

function removeDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * @swagger
 * /api/user/register/face/train:
 *   post:
 *     summary: 训练人脸注册模型
 *     description: 提交会话ID，完成图像收集后调用Python脚本进行人脸注册训练。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: 注册会话ID
 *     responses:
 *       200:
 *         description: 训练成功，返回训练结果
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
 *                   nullable: true
 *       400:
 *         description: 参数缺失、会话无效或状态错误
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
 *         description: 训练失败
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
    const { session_id } = await request.json();
    if (!session_id) {
      return NextResponse.json({ success: false, message: '缺少会话ID' }, { status: 400 });
    }
    const session = registrationSessions[session_id];
    if (!session) {
      return NextResponse.json({ success: false, message: '无效的会话ID' }, { status: 400 });
    }
    if (session.status !== 'collected') {
      return NextResponse.json({ success: false, message: '会话状态错误，请先完成图像收集' }, { status: 400 });
    }
    // 移动 data/ 下图片到 Facedata/
    const baseDir = path.join(process.cwd(), 'face-recognition-cv2-master', 'face-recognition-cv2-master');
    const dataDir = path.join(baseDir, 'data');
    const faceDir = path.join(baseDir, 'Facedata');
    moveAllFiles(dataDir, faceDir);
    // 调用 main.py 进行训练（不传 image_base64，只传 --action register --username）
    return new Promise((resolve) => {
      const py = spawn('python', [
        'face-recognition-cv2-master/face-recognition-cv2-master/main.py',
        '--action', 'register',
        '--username', session.username
      ]);
      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk });
      py.stderr.on('data', (err) => { console.error('py err:', err.toString()) });
      py.on('close', () => {
        try {
          const result = JSON.parse(data);
          session.status = 'completed';
          // 更新用户role为authenticated
          const { UserService } = require('@/lib/userService');
          UserService.updateUser(session.user_id, { role: 'authenticated' });
          // 清理 session 和 data 目录
          delete registrationSessions[session_id];
          removeDir(dataDir);
          resolve(NextResponse.json({ ...result, success: true }));
        } catch (e) {
          resolve(NextResponse.json({ success: false, message: 'Python返回异常', error: e }));
        }
      });
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: '训练失败', error: String(e) }, { status: 500 });
  }
} 