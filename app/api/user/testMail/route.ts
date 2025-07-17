import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/emailService';
import { Result } from '@/lib/result';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/user/testMail:
 *   get:
 *     summary: 测试邮件发送
 *     description: 发送一封测试邮件到指定邮箱。
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: 目标邮箱地址
 *     responses:
 *       200:
 *         description: 邮件发送成功
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
 *         description: 邮箱参数无效
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
 *         description: 邮件发送失败
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(Result.error('400', '邮箱参数无效'));
    }

    const emailService = new EmailService();
    await emailService.testEmail(email);
    return NextResponse.json(Result.success('邮件已发送'));
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    return NextResponse.json(Result.error('500', '邮件发送失败'));
  }
} 