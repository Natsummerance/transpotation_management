import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

export async function POST(request: NextRequest) {
  try {
    const { uname, password } = await request.json();

    // 参数验证
    if (!uname || uname.trim() === '') {
      return NextResponse.json(Result.error('400', '用户名不能为空'));
    }
    if (!password || password.trim() === '') {
      return NextResponse.json(Result.error('400', '密码不能为空'));
    }

    // 登录验证
    const user = await UserService.loginService(uname, password);
    if (user) {
      return NextResponse.json(Result.success('1', user, '登录成功！'));
    } else {
      return NextResponse.json(Result.error('123', '账号或密码错误！'));
    }
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(Result.error('500', '服务器内部错误'));
  }
} 