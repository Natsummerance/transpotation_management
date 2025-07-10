import { NextRequest, NextResponse } from 'next/server';
import { EmailCodeUtil } from '@/lib/emailCodeUtil';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请提供邮箱地址' });
    }

    // 检查验证码
    const isValid = await EmailCodeUtil.checkCode(email, code || '');
    
    return NextResponse.json({
      email: email,
      providedCode: code,
      isValid: isValid,
      message: isValid ? '验证码正确' : '验证码错误或已过期'
    });
  } catch (error) {
    console.error('检查验证码失败:', error);
    return NextResponse.json({ error: '检查失败' });
  }
} 