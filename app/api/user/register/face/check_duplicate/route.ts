import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

/**
 * @swagger
 * /api/user/register/face/check_duplicate:
 *   post:
 *     summary: 检查人脸是否重复注册
 *     description: 提交Base64图片，调用Python脚本检测人脸是否已注册。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64编码的人脸图片
 *     responses:
 *       200:
 *         description: 检测成功，返回重复检测结果
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
 *         description: 缺少图片
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
 *         description: 检测失败
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
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ success: false, message: '缺少图片' }, { status: 400 });
    }
    return new Promise((resolve) => {
      const py = spawn('python', [
        'face-recognition-cv2-master/face-recognition-cv2-master/main.py',
        '--action', 'check_duplicate',
        '--image_base64', image
      ]);
      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk });
      py.stderr.on('data', (err) => { console.error('py err:', err.toString()) });
      py.on('close', () => {
        try {
          const result = JSON.parse(data);
          resolve(NextResponse.json({ success: true, ...result }));
        } catch (e) {
          resolve(NextResponse.json({ success: false, message: 'Python返回异常', error: e }));
        }
      });
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: '检测失败', error: String(e) }, { status: 500 });
  }
} 