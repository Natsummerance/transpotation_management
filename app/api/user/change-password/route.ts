import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/userService';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 });
    }
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: "无效的token" }, { status: 401 });
    }
    const uid = Number(payload.uid);
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }
    // 校验当前密码
    const user = await UserService.getUserById(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "用户不存在" }, { status: 404 });
    }
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "当前密码错误" }, { status: 400 });
    }
    // 修改密码
    await UserService.updateUser(uid, { password: newPassword });
    return NextResponse.json({ success: true, message: "密码修改成功" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ success: false, message: "密码修改失败" }, { status: 500 });
  }
} 