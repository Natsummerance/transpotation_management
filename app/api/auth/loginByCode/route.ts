import { NextRequest, NextResponse } from 'next/server';
import { EmailCodeUtil } from '@/lib/emailCodeUtil';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(Result.error('400', '邮箱和验证码不能为空'));
    }

    // 验证验证码
    const isValid = await EmailCodeUtil.checkCode(email, code);
    if (!isValid) {
      return NextResponse.json(Result.error('401', '验证码错误或已过期'));
    }

    // 登录或自动注册
    const user = await UserService.loginByEmail(email);
    if (!user) {
      return NextResponse.json(Result.error('404', '该邮箱未注册'));
    }

    // 登录成功后移除验证码，防止重复使用
    await EmailCodeUtil.removeCode(email);
    
    return NextResponse.json(Result.success('1', user, '登录成功！'));
  } catch (error) {
    console.error('邮箱登录失败:', error);
    return NextResponse.json(Result.error('500', '登录失败'));
  }
} 