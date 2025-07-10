import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(Result.error('400', '图片数据不能为空'));
    }

    const user = await UserService.faceRecognitionService(image);
    if (user) {
      return NextResponse.json(Result.success('1', user, '人脸识别成功！'));
    } else {
      return NextResponse.json(Result.error('445', '人脸识别失败，未找到匹配用户'));
    }
  } catch (error) {
    console.error('人脸识别失败:', error);
    return NextResponse.json(Result.error('500', '人脸识别失败'));
  }
} 