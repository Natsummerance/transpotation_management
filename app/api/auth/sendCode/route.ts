import { NextRequest, NextResponse } from 'next/server';
import { EmailCodeUtil } from '@/lib/emailCodeUtil';
import { EmailService } from '@/lib/emailService';
import { Result } from '@/lib/result';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(Result.error('400', '邮箱不能为空'));
    }

    // 生成验证码
    const code = EmailCodeUtil.generateCode();
    
    // 保存验证码
    await EmailCodeUtil.saveCode(email, code);
    
    // 发送邮件
    const emailService = new EmailService();
    await emailService.sendCodeEmail(email, code);
    
    return NextResponse.json(Result.success('验证码已发送'));
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(Result.error('500', '发送验证码失败'));
  }
} 