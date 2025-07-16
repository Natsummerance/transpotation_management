import { type NextRequest, NextResponse } from "next/server"
import { decryptAES } from "@/lib/crypto";

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let { image, action, userId } = await request.json();
    if (image) {
      image = decryptAES(image);
    }

    // 模拟人脸识别处理
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (action === "verify") {
      // 人脸识别验证
      const confidence = Math.random() * 100
      const isMatch = confidence > 70

      if (isMatch) {
        // 生成模拟token
        const token = `face_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        return NextResponse.json({
          success: true,
          confidence: confidence.toFixed(2),
          token,
          user: {
            id: "user_123",
            username: userId,
            name: "张三",
            department: "交通管理科",
          },
          message: "人脸识别成功",
        })
      } else {
        return NextResponse.json({
          success: false,
          confidence: confidence.toFixed(2),
          message: "人脸识别失败，请重试",
        })
      }
    } else if (action === "register") {
      // 人脸注册
      const faceId = `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return NextResponse.json({
        success: true,
        faceId,
        message: "人脸注册成功",
        features: {
          quality: "高",
          clarity: "清晰",
          angle: "正面",
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "无效的操作类型",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Face recognition error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "人脸识别服务异常",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // 获取用户的人脸信息
    const faceData = {
      userId,
      faceId: `face_${userId}_registered`,
      registeredAt: "2024-01-15T10:30:00Z",
      lastUsed: "2024-01-20T14:25:00Z",
      usageCount: 45,
      quality: "高",
      status: "active",
    }

    return NextResponse.json({
      success: true,
      data: faceData,
    })
  } catch (error) {
    console.error("Get face data error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取人脸数据失败",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const faceId = searchParams.get("faceId")

    // 模拟删除人脸数据
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "人脸数据删除成功",
    })
  } catch (error) {
    console.error("Delete face data error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "删除人脸数据失败",
      },
      { status: 500 },
    )
  }
}
