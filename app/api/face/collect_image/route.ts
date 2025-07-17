import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * @swagger
 * /api/face/collect_image:
 *   post:
 *     summary: 采集人脸图像
 *     description: 提交会话ID和Base64图像，调用Python脚本采集人脸图像。
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
 *               image:
 *                 type: string
 *                 description: Base64编码的图像数据
 *     responses:
 *       200:
 *         description: 采集结果
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
 *         description: 图像采集失败
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
    const { session_id, image } = await request.json();
    
    if (!session_id || !image) {
      return NextResponse.json({ 
        success: false, 
        message: '缺少会话ID或图像数据' 
      });
    }
    
    // 使用Python脚本进行图像采集
    const pythonPath = path.join(process.cwd(), 'RDD_yolo11', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), 'face-recognition-cv2-master', 'face-recognition-cv2-master', 'face_api.py');
    
    return new Promise((resolve) => {
      const py = spawn(pythonPath, [
        scriptPath,
        '--action', 'collect_image',
        '--session_id', session_id,
        '--image_base64', image
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
      message: '图像采集失败', 
      error: (error as Error).message 
    });
  }
} 