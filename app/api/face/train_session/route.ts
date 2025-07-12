import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();
    
    if (!session_id) {
      return NextResponse.json({ 
        success: false, 
        message: '缺少会话ID' 
      });
    }
    
    // 使用Python脚本进行模型训练
    const pythonPath = path.join(process.cwd(), 'RDD_yolo11', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'face-recognition-cv2-master', 'face-recognition-cv2-master', 'face_api.py');
    
    return new Promise((resolve) => {
      const py = spawn(pythonPath, [
        scriptPath,
        '--action', 'train_session',
        '--session_id', session_id
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
            error: (e as Error).message,
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
      message: '模型训练失败', 
      error: (error as Error).message 
    });
  }
} 