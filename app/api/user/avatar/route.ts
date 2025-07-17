import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/userService';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

/**
 * @swagger
 * /api/user/avatar:
 *   post:
 *     summary: 上传或更新用户头像
 *     description: 支持 multipart/form-data 文件上传和 application/json base64 数据上传，需认证。
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 头像图片文件
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: base64编码头像数据
 *     responses:
 *       200:
 *         description: 头像上传或更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 未授权或token无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 头像上传失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *   get:
 *     summary: 获取用户头像
 *     description: 获取当前用户头像信息，需认证。
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回头像信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *       401:
 *         description: 未授权或token无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 获取头像失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
export async function POST(request: NextRequest) {
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
    
    // 检查请求内容类型
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // 处理文件上传
      const formData = await request.formData();
      const file = formData.get('avatar') as File;
      
      if (!file) {
        return NextResponse.json(
          {
            success: false,
            message: "没有上传文件",
          },
          { status: 400 },
        );
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          {
            success: false,
            message: "只能上传图片文件",
          },
          { status: 400 },
        );
      }

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: "文件大小不能超过5MB",
          },
          { status: 400 },
        );
      }

      // 创建上传目录
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
      await mkdir(uploadDir, { recursive: true });

      // 生成唯一文件名
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uid}_${uuidv4()}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // 保存文件
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // 复制一份到 public/uploads/avatars 目录（与主路径一致，无需再复制到 runs/upload）
      // 头像URL统一为 /uploads/avatars/xxx.jpg

      // 更新用户头像信息到数据库
      const success = await UserService.updateUser(uid, { avatar: `/uploads/avatars/${fileName}` });
      
      if (!success) {
        return NextResponse.json(
          {
            success: false,
            message: "更新头像失败",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: { avatar: `/uploads/avatars/${fileName}` },
        message: "头像上传成功",
      });

    } else {
      // 处理base64数据
      const { avatar } = await request.json();
      
      if (!avatar) {
        return NextResponse.json(
          {
            success: false,
            message: "没有头像数据",
          },
          { status: 400 },
        );
      }

      // 验证base64格式
      if (!avatar.startsWith('data:image/')) {
        return NextResponse.json(
          {
            success: false,
            message: "无效的图片格式",
          },
          { status: 400 },
        );
      }

      // 更新用户头像信息到数据库
      const success = await UserService.updateUser(uid, { avatar });
      
      if (!success) {
        return NextResponse.json(
          {
            success: false,
            message: "更新头像失败",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: { avatar },
        message: "头像更新成功",
      });
    }

  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "头像上传失败",
      },
      { status: 500 },
    );
  }
}

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

    const uid = Number(payload.uid);
    const user = await UserService.getUserById(uid);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "用户不存在",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { avatar: user.avatar },
    });

  } catch (error) {
    console.error("Get avatar error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取头像失败",
      },
      { status: 500 },
    );
  }
} 