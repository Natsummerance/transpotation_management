import { NextRequest, NextResponse } from 'next/server';
import { EmailCodeUtil } from '@/lib/emailCodeUtil';

/**
 * @swagger
 * /api/auth/checkCode:
 *   post:
 *     summary: 校验邮箱验证码
 *     description: 校验用户输入的邮箱验证码是否正确及有效。
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
 *               code:
 *                 type: string
 *                 description: 邮箱验证码
 *     responses:
 *       200:
 *         description: 校验结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 providedCode:
 *                   type: string
 *                 isValid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 请求参数缺失
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: 校验失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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