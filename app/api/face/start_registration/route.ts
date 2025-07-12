import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ 
        success: false, 
        message: '缺少用户名' 
      });
    }
    
    // 使用Python脚本进行人脸录入会话开始
    const pythonPath = path.join(process.cwd(), 'RDD_yolo11', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'face-recognition-cv2-master', 'face-recognition-cv2-master', 'face_api.py');
    
    return new Promise((resolve) => {
      const py = spawn(pythonPath, [
        scriptPath,
        '--action', 'start_registration',
        '--username', username
      ]);
      
      let data = '';
      let errorData = '';
      
      py.stdout.on('data', (chunk) => { 
        data += chunk.toString();
        console.log('Python stdout:', chunk.toString());
      });
      
      py.stderr.on('data', (err) => { 
        errorData += err.toString();
        console.error('Python stderr:', err.toString());
      });
      
      py.on('close', (code) => {
        console.log('Python process exited with code:', code);
        
        try {
          if (data.trim()) {
            const result = JSON.parse(data.trim());
            resolve(NextResponse.json(result));
          } else {
            resolve(NextResponse.json({ 
              success: false, 
              message: 'Python返回空结果', 
              error: errorData 
            }));
          }
        } catch (e) {
          console.error('JSON parse error:', e);
          resolve(NextResponse.json({ 
            success: false, 
            message: 'Python返回异常', 
            error: e.message,
            output: data,
            errors: errorData
          }));
        }
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: '开始录入失败', 
      error: error.message 
    });
  }
} 