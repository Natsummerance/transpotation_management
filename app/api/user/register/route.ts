import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

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