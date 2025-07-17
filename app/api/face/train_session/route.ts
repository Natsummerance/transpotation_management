import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * @swagger
 * /api/face/train_session:
 *   post:
 *     summary: 训练人脸识别模型
 *     description: 提交会话ID，调用Python脚本进行人脸识别模型训练。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: 会话ID
 *     responses:
 *       200:
 *         description: 训练结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 output:
 *                   type: string
 *                   nullable: true
 *                 errors:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: 请求参数缺失
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
 *         description: 训练失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
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