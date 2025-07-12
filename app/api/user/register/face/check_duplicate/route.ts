import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ success: false, message: '缺少图片' }, { status: 400 });
    }
    return new Promise((resolve) => {
      const py = spawn('python', [
        'face-recognition-cv2-master/face-recognition-cv2-master/main.py',
        '--action', 'check_duplicate',
        '--image_base64', image
      ]);
      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk });
      py.stderr.on('data', (err) => { console.error('py err:', err.toString()) });
      py.on('close', () => {
        try {
          const result = JSON.parse(data);
          resolve(NextResponse.json({ success: true, ...result }));
        } catch (e) {
          resolve(NextResponse.json({ success: false, message: 'Python返回异常', error: e }));
        }
      });
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: '检测失败', error: String(e) }, { status: 500 });
  }
} 