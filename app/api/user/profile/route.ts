import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    // 模拟用户数据
    const userData = {
      id: "user_123",
      username: "zhangsan",
      email: "zhangsan@example.com",
      phone: "13800138000",
      name: "张三",
      department: "交通管理科",
      position: "高级工程师",
      bio: "负责智慧交通系统的运维和管理工作",
      avatar: null,
      createdAt: "2023-06-15T08:00:00Z",
      lastLoginAt: "2024-01-20T09:00:00Z",
      loginCount: 156,
      status: "active",
      permissions: ["read", "write", "admin"],
    }

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取用户信息失败",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const updateData = await request.json()

    // 模拟数据验证
    if (updateData.email && !updateData.email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          message: "邮箱格式不正确",
        },
        { status: 400 },
      )
    }

    if (updateData.phone && !/^1[3-9]\d{9}$/.test(updateData.phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "手机号格式不正确",
        },
        { status: 400 },
      )
    }

    // 模拟更新处理
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const updatedUser = {
      id: "user_123",
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "用户信息更新成功",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "更新用户信息失败",
      },
      { status: 500 },
    )
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
