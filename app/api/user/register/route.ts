import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: 用户注册
 *     description: 提交用户名和密码进行注册。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uname:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200:
 *         description: 注册成功，返回用户信息
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
 *         description: 用户名和密码不能为空
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       456:
 *         description: 用户名已存在
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
 *         description: 注册失败
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
    const newUser = await request.json();

    if (!newUser.uname || !newUser.password) {
      return NextResponse.json(Result.error('400', '用户名和密码不能为空'));
    }

    const user = await UserService.registService(newUser);
    if (user) {
      return NextResponse.json(Result.success('1', user, '注册成功！'));
    } else {
      return NextResponse.json(Result.error('456', '用户名已存在！'));
    }
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(Result.error('500', '注册失败'));
  }
} 