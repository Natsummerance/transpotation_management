import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { image, username } = await request.json();
    if (!image || !username) {
      return NextResponse.json({ code: 0, msg: '缺少参数' });
    }
    return new Promise((resolve) => {
      const py = spawn('python', [
        'face-recognition-cv2-master/face-recognition-cv2-master/main.py',
        '--action', 'register',
        '--image_base64', image,
        '--username', username
      ]);
      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk });
      py.stderr.on('data', (err) => { console.error('py err:', err.toString()) });
      py.on('close', () => {
        try {
          const result = JSON.parse(data);
          resolve(NextResponse.json(result));
        } catch (e) {
          resolve(NextResponse.json({ code: 0, msg: 'Python返回异常', error: e }));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ code: 0, msg: '注册失败', error });
  }
} 