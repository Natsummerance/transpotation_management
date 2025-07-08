import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "未提供认证令牌",
        },
        { status: 401 },
      )
    }

    // 模拟注销处理
    // 在实际应用中，这里会：
    // 1. 验证token的有效性
    // 2. 将token加入黑名单
    // 3. 清除服务器端的会话信息
    // 4. 记录注销日志

    await new Promise((resolve) => setTimeout(resolve, 500))

    // 记录注销日志
    const logData = {
      action: "logout",
      token: token.substring(0, 10) + "...",
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    }

    console.log("Logout log:", logData)

    return NextResponse.json({
      success: true,
      message: "注销成功",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "注销过程中发生错误",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  // 获取当前活跃会话信息
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "未提供认证令牌",
        },
        { status: 401 },
      )
    }

    // 模拟获取会话信息
    const sessionInfo = {
      token: token.substring(0, 10) + "...",
      loginTime: "2024-01-20T09:00:00Z",
      lastActivity: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || "192.168.1.100",
      userAgent: request.headers.get("user-agent") || "Chrome/120.0.0.0",
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8小时后过期
    }

    return NextResponse.json({
      success: true,
      data: sessionInfo,
    })
  } catch (error) {
    console.error("Get session error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取会话信息失败",
      },
      { status: 500 },
    )
  }
}
