import { NextRequest, NextResponse } from 'next/server';
import { EmailCodeUtil } from '@/lib/emailCodeUtil';
import { EmailService } from '@/lib/emailService';
import { Result } from '@/lib/result';

/**
 * @swagger
 * /api/auth/sendCode:
 *   post:
 *     summary: 发送邮箱验证码
 *     description: 向指定邮箱发送验证码。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 用户邮箱地址
 *     responses:
 *       200:
 *         description: 验证码发送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       400:
 *         description: 邮箱不能为空
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
 *         description: 发送验证码失败
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