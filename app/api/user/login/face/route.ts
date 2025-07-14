import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export async function POST(request: NextRequest) {
  try {
    const { user_id, username } = await request.json();

    // 参数验证
    if (!user_id || user_id === undefined) {
      return NextResponse.json(Result.error('400', '用户ID不能为空'));
    }

    // 根据用户ID获取用户信息
    const user = await UserService.getUserById(user_id);
    if (user) {
      // 生成token
      const token = jwt.sign({ uid: user.uid, uname: user.uname }, JWT_SECRET, { expiresIn: '8h' });
      return NextResponse.json(Result.success('1', { ...user, token }, '人脸识别登录成功！'));
    } else {
      return NextResponse.json(Result.error('404', '用户不存在'));
    }
  } catch (error) {
    console.error('人脸识别登录失败:', error);
    return NextResponse.json(Result.error('500', '服务器内部错误'));
  }
} 