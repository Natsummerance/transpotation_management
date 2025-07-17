import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: 用户账号密码登录
 *     description: 通过账号和密码登录，返回用户信息和 token。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: 账号
 *               password:
 *                 type: string
 *                 description: 密码
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
 *         description: 账号或密码不能为空
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       123:
 *         description: 账号或密码错误
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
    const { account, password } = await request.json();

    // 参数验证
    if (!account || account.trim() === '') {
      return NextResponse.json(Result.error('400', '账号不能为空'));
    }
    if (!password || password.trim() === '') {
      return NextResponse.json(Result.error('400', '密码不能为空'));
    }

    // 登录验证
    const user = await UserService.loginService(account, password);
    if (user) {
      // 生成token
      const token = jwt.sign({ uid: user.uid, uname: user.uname }, JWT_SECRET, { expiresIn: '8h' });
      return NextResponse.json(Result.success('1', { ...user, token }, '登录成功！'));
    } else {
      return NextResponse.json(Result.error('123', '账号或密码错误！'));
    }
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(Result.error('500', '服务器内部错误'));
  }
} 