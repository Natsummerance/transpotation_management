import { NextRequest, NextResponse } from 'next/server';
import { EmailCodeUtil } from '@/lib/emailCodeUtil';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    console.log('验证码登录请求:', { email, code });

    if (!email || !code) {
      console.log('参数验证失败: 邮箱或验证码为空');
      return NextResponse.json(Result.error('400', '邮箱和验证码不能为空'));
    }

    // 验证验证码
    console.log('开始验证验证码...');
    const isValid = await EmailCodeUtil.checkCode(email, code);
    console.log('验证码验证结果:', isValid);
    if (!isValid) {
      console.log('验证码验证失败');
      return NextResponse.json(Result.error('401', '验证码错误或已过期'));
    }

    // 登录或自动注册
    console.log('开始查找用户...');
    const user = await UserService.loginByEmail(email);
    console.log('用户查找结果:', user ? '找到用户' : '用户不存在');
    if (!user) {
      console.log('用户不存在');
      return NextResponse.json(Result.error('404', '该邮箱未注册'));
    }

    // 登录成功后移除验证码，防止重复使用
    await EmailCodeUtil.removeCode(email);
    console.log('验证码登录成功，用户信息:', { uid: user.uid, uname: user.uname, email: user.email });
    
    const response = Result.success('1', user, '登录成功！');
    console.log('返回的响应数据:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('邮箱登录失败:', error);
    return NextResponse.json(Result.error('500', '登录失败'));
  }
} 