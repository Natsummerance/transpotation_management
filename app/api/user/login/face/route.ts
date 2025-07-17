import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

/**
 * @swagger
 * /api/user/login/face:
 *   post:
 *     summary: 人脸识别登录（用户信息）
 *     description: 通过 user_id 或 username 登录，返回用户信息和 token。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: 用户ID
 *               username:
 *                 type: string
 *                 description: 用户名
 *     responses:
 *       200:
 *         description: 登录成功，返回用户信息和token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 data:
 *                   type: object
 *                 msg:
 *                   type: string
 *       400:
 *         description: 用户ID或用户名不能为空
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       404:
 *         description: 用户不存在
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
 *         description: 服务器内部错误
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
    const { user_id, username } = await request.json();

    // 参数验证
    if ((!user_id || user_id === undefined) && (!username || username === undefined)) {
      return NextResponse.json(Result.error('400', '用户ID或用户名不能为空'));
    }

    // 优先用user_id查找，否则用username查找
    let user = null;
    if (user_id) {
      user = await UserService.getUserById(user_id);
    } else if (username) {
      user = await UserService.getUserByUsername(username);
    }

    if (user) {
      // 生成token
      const token = jwt.sign({ uid: user.uid, uname: user.uname }, JWT_SECRET, { expiresIn: '8h' });
      return NextResponse.json(Result.success('1', { ...user, token }, '人脸识别登录成功！'));
    } else {
      return NextResponse.json(Result.error('404', '用户不存在'));
    }
  } catch (error) {
    console.error('人脸识别登录失败:', error);
    return NextResponse.json(Result.error('500', '服务器内部错误'));
  }
} 