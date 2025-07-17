import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/emailService';
import { Result } from '@/lib/result';

/**
 * @swagger
 * /api/auth/testMail:
 *   post:
 *     summary: 测试邮件发送
 *     description: 向指定邮箱发送一封测试邮件，用于验证邮件服务配置是否正确。
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
 *         description: 测试邮件发送成功
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
 *         description: 测试邮件发送失败
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

    // 显示当前配置
    console.log('当前邮箱配置:', {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      user: process.env.MAIL_USER ? `${process.env.MAIL_USER.substring(0, 3)}***` : '未配置',
      pass: process.env.MAIL_PASS ? '已配置' : '未配置'
    });

    // 测试邮件发送
    const emailService = new EmailService();
    await emailService.testEmail(email);
    
    return NextResponse.json(Result.success('测试邮件发送成功'));
  } catch (error: any) {
    console.error('测试邮件发送失败:', error);
    return NextResponse.json(Result.error('500', `测试失败: ${error.message}`));
  }
} 