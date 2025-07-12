import { NextRequest, NextResponse } from 'next/server';
import { registrationSessions } from '../start/route';
import fs from 'fs';
import path from 'path';

function saveBase64Image(base64: string, filePath: string) {
  // 去掉前缀
  const base64Data = base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, image } = await request.json();
    if (!session_id || !image) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 });
    }
    const session = registrationSessions[session_id];
    if (!session) {
      return NextResponse.json({ success: false, message: '无效的会话ID' }, { status: 400 });
    }
    if (session.status !== 'collecting') {
      return NextResponse.json({ success: false, message: '会话状态错误' }, { status: 400 });
    }
    // 保存图片到 data 目录
    const dataDir = path.join(process.cwd(), 'face-recognition-cv2-master', 'face-recognition-cv2-master', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    session.collected_images += 1;
    const filename = `User.${session.user_id}.${session.collected_images}.jpg`;
    const filePath = path.join(dataDir, filename);
    saveBase64Image(image, filePath);
    const progress = (session.collected_images / session.target_images) * 100;
    if (session.collected_images >= session.target_images) {
      session.status = 'collected';
      return NextResponse.json({ success: true, collected: session.collected_images, target: session.target_images, progress: 100, completed: true, message: '图像收集完成，准备训练' });
    }
    return NextResponse.json({ success: true, collected: session.collected_images, target: session.target_images, progress: Math.round(progress), completed: false, message: `已收集 ${session.collected_images} / ${session.target_images} 张图像` });
  } catch (e) {
    return NextResponse.json({ success: false, message: '收集图像失败', error: String(e) }, { status: 500 });
  }
} 