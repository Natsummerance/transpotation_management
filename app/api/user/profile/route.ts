import { type NextRequest, NextResponse } from "next/server"
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/userService';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "未授权访问",
        },
        { status: 401 },
      );
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的token",
        },
        { status: 401 },
      );
    }

    // 根据uid查找用户
    const user = await UserService.getUserById(Number(payload.uid));
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "用户不存在",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取用户信息失败",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "未授权访问",
        },
        { status: 401 },
      );
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的token",
        },
        { status: 401 },
      );
    }

    const uid = Number(payload.uid);
    const updateData = await request.json();

    // 只允许更新实际存在的字段
    const allowedFields = ["uname", "email", "phone"];
    const updates: any = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) updates[key] = updateData[key];
    }

    // 校验邮箱格式
    if (updates.email && !updates.email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          message: "邮箱格式不正确",
        },
        { status: 400 },
      );
    }
    // 校验手机号格式
    if (updates.phone && !/^1[3-9]\d{9}$/.test(updates.phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "手机号格式不正确",
        },
        { status: 400 },
      );
    }

    const ok = await UserService.updateUser(uid, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 });
    }
    // 返回最新用户信息
    const user = await UserService.getUserById(uid);
    return NextResponse.json({ success: true, data: user, message: "用户信息更新成功" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "更新用户信息失败",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "未授权访问",
        },
        { status: 401 },
      )
    }

    // 模拟账户删除处理
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      message: "账户删除成功",
      deletedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Delete profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "删除账户失败",
      },
      { status: 500 },
    )
  }
}
