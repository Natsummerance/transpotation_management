import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

/**
 * @swagger
 * /api/login/face:
 *   post:
 *     summary: 人脸识别登录
 *     description: 提交图片数据，进行人脸识别并返回用户信息。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64编码的人脸图片数据
 *     responses:
 *       200:
 *         description: 人脸识别成功，返回用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 data:
 *                   type: object
 *                   nullable: true
 *                 msg:
 *                   type: string
 *       400:
 *         description: 图片数据不能为空
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       445:
 *         description: 人脸识别失败，未找到匹配用户
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       500:
 *         description: 人脸识别服务异常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(Result.error('400', '图片数据不能为空'));
    }

    const user = await UserService.faceRecognitionService(image);
    if (user) {
      return NextResponse.json(Result.success('1', user, '人脸识别成功！'));
    } else {
      return NextResponse.json(Result.error('445', '人脸识别失败，未找到匹配用户'));
    }
  } catch (error) {
    console.error('人脸识别失败:', error);
    return NextResponse.json(Result.error('500', '人脸识别失败'));
  }
} 