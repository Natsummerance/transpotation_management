import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

/**
 * @swagger
 * /api/user/register/face:
 *   post:
 *     summary: 用户人脸注册
 *     description: 提交Base64图片和用户名，调用Python脚本进行人脸注册。
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
 *               username:
 *                 type: string
 *                 description: 用户名
 *     responses:
 *       200:
 *         description: 注册成功，返回注册结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 缺少参数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 msg:
 *                   type: string
 *       500:
 *         description: 注册失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 msg:
 *                   type: string
 *                 error:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  try {
    const { image, username } = await request.json();
    if (!image || !username) {
      return NextResponse.json({ code: 0, msg: '缺少参数' });
    }
    return new Promise((resolve) => {
      const py = spawn('python', [
        'face-recognition-cv2-master/face-recognition-cv2-master/main.py',
        '--action', 'register',
        '--image_base64', image,
        '--username', username
      ]);
      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk });
      py.stderr.on('data', (err) => { console.error('py err:', err.toString()) });
      py.on('close', () => {
        try {
          const result = JSON.parse(data);
          resolve(NextResponse.json(result));
        } catch (e) {
          resolve(NextResponse.json({ code: 0, msg: 'Python返回异常', error: e }));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ code: 0, msg: '注册失败', error });
  }
} 