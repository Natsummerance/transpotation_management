import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

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