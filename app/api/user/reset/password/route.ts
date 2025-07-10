import { NextRequest, NextResponse } from "next/server";

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