import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/user/reset/password:
 *   post:
 *     summary: 重置用户密码
 *     description: 通过邮箱和新密码重置用户密码。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 用户邮箱
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码重置成功
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
 *         description: 参数缺失
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
export async function POST(req: NextRequest) {
  const { email, newPassword } = await req.json();
  // mock: 假设用户存在并重置成功
  // 实际可查数据库并更新密码
  if (!email || !newPassword) {
    return NextResponse.json({ code: "1", msg: "参数缺失" });
  }
  // 假设用户存在
  return NextResponse.json({ code: "0", msg: "密码重置成功" });
} 