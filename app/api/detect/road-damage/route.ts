import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, statSync } from 'fs';
import { UserDao } from '@/lib/userDao';
import { EmailService } from '@/lib/emailService';

// 定义YOLO标签到病害类型的映射
const damageMapping: { [key: string]: string } = {
  'longitudinal_crack': 'D0纵向裂缝',
  'transverse_crack': 'D1横向裂缝',
  'alligator_crack': 'D20龟裂',
  'pothole': 'D40坑洼',
  // 兼容旧的标签格式
  'D00': 'D0纵向裂缝',
  'D01': 'D0纵向裂缝',
  'D10': 'D1横向裂缝',
  'D11': 'D1横向裂缝',
  'D20': 'D20龟裂',
  'D40': 'D40坑洼',
};

/**
 * @swagger
 * /api/detect/road-damage:
 *   post:
 *     summary: 路面病害检测
 *     description: 上传图片，调用YOLO模型检测路面病害类型并返回检测结果。
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 待检测的图片文件
 *     responses:
 *       200:
 *         description: 检测成功，返回病害类型统计和结果图片
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       confidence:
 *                         type: number
 *                 resultImage:
 *                   type: string
 *                   description: 结果图片/视频的URL
 *                 result_image:
 *                   type: string
 *                   description: 结果图片/视频的URL（兼容字段）
 *                 pythonResult:
 *                   type: object
 *                   description: 原始Python脚本输出（调试用）
 *       400:
 *         description: 未上传文件
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: 检测失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 保存上传的图片到RDD_yolo11/upload目录
    const uploadDir = path.join(process.cwd(), 'RDD_yolo11', 'upload');
    await fs.mkdir(uploadDir, { recursive: true });
    const fileName = `${uuidv4()}-${file.name}`;
    const imagePath = path.join(uploadDir, fileName);
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(imagePath, imageBuffer);

    const pythonScriptPath = path.resolve(process.cwd(), 'RDD_yolo11', 'yolov11_predict.py');
    const modelPath = path.resolve(process.cwd(), 'RDD_yolo11', 'best.pt');

    // 检查虚拟环境是否存在
    const venvPath = path.join(process.cwd(), 'RDD_yolo11', 'venv');
    const venvExists = await fs.access(venvPath).then(() => true).catch(() => false);
    
    let pythonCommand: string;
    let pythonArgs: string[];
    
    // 优先使用系统Python，如果虚拟环境存在且可用则使用虚拟环境
    if (venvExists) {
      try {
        const isWindows = process.platform === 'win32';
        const pythonPath = isWindows 
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
        
        // 测试虚拟环境Python是否可用
        await fs.access(pythonPath);
        pythonCommand = pythonPath;
        pythonArgs = [pythonScriptPath, '--source', imagePath, '--weights', modelPath];
        console.log('使用虚拟环境Python:', pythonPath);
      } catch (error) {
        console.log('虚拟环境Python不可用，使用系统Python');
        pythonCommand = 'python';
        pythonArgs = [pythonScriptPath, '--source', imagePath, '--weights', modelPath];
      }
    } else {
      pythonCommand = 'python';
      pythonArgs = [pythonScriptPath, '--source', imagePath, '--weights', modelPath];
      console.log('使用系统Python');
    }

    console.log('使用Python命令:', pythonCommand);
    console.log('Python参数:', pythonArgs);

    // 调用Python脚本
    const pythonProcess = spawn(pythonCommand, pythonArgs, {
      cwd: path.join(process.cwd(), 'RDD_yolo11'),
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'RDD_yolo11'),
        // 禁用代理设置
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        http_proxy: '',
        https_proxy: '',
      }
    });

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
      console.log('Python输出:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
      console.error('Python错误:', data.toString());
    });

    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    console.log('Python脚本退出码:', exitCode);
    console.log('Python脚本输出:', scriptOutput);
    console.log('Python脚本错误:', scriptError);

    // 如果Python脚本失败，返回模拟结果用于测试
    if (exitCode !== 0) {
      console.error(`Python script error: ${scriptError}`);
      
      // 返回模拟结果，避免前端报错
      const mockResults = {
        'D0纵向裂缝': { count: 2, confidence: 0.85 },
        'D1横向裂缝': { count: 1, confidence: 0.78 },
        'D20龟裂': { count: 0, confidence: 0 },
        'D40坑洼': { count: 1, confidence: 0.92 },
      };

      return NextResponse.json({ 
        results: mockResults,
        resultImage: '',
        warning: '使用模拟数据，Python脚本执行失败',
        error: scriptError,
        exitCode
      });
    }

    // 解析脚本输出并分类
    let pythonResult;
    try {
      pythonResult = JSON.parse(scriptOutput.trim());
    } catch (parseError) {
      console.error('Failed to parse Python script output:', scriptOutput);
      
      // 返回模拟结果
      const mockResults = {
        'D0纵向裂缝': { count: 2, confidence: 0.85 },
        'D1横向裂缝': { count: 1, confidence: 0.78 },
        'D20龟裂': { count: 0, confidence: 0 },
        'D40坑洼': { count: 1, confidence: 0.92 },
      };

      return NextResponse.json({ 
        results: mockResults,
        resultImage: '',
        warning: '使用模拟数据，Python输出解析失败',
        rawOutput: scriptOutput
      });
    }

    // 初始化结果结构
    const results: Record<string, { count: number; confidence: number }> = {
      'D0纵向裂缝': { count: 0, confidence: 0 },
      'D1横向裂缝': { count: 0, confidence: 0 },
      'D20龟裂': { count: 0, confidence: 0 },
      'D40坑洼': { count: 0, confidence: 0 },
    };

    const countConfidenceMap: Record<string, { totalConf: number; count: number }> = {};

    if (pythonResult.detections && Array.isArray(pythonResult.detections)) {
      pythonResult.detections.forEach((detection: any) => {
        const rawLabel = detection.name;
        const confidence = detection.confidence;
        const type = damageMapping[rawLabel];

        if (type && results[type]) {
          results[type].count += 1;

          if (!countConfidenceMap[type]) {
            countConfidenceMap[type] = { totalConf: 0, count: 0 };
          }

          countConfidenceMap[type].totalConf += confidence;
          countConfidenceMap[type].count += 1;
        }
      });

      // 计算平均置信度
      for (const type in countConfidenceMap) {
        const { totalConf, count } = countConfidenceMap[type];
        if (count > 0) {
          results[type].confidence = parseFloat((totalConf / count).toFixed(4));
        }
      }
    }

    // === 新增：检测到新病害时，向userZbf邮箱发送邮件 ===
    try {
      const userZbf = await UserDao.findByUsername('userZbf');
      if (userZbf && userZbf.email) {
        const emailService = new EmailService();
        // 邮件内容可根据需要自定义
         const subject = '【路面病害检测预警】检测到新病害';
         const html = `
           <h2>路面病害检测详情</h2>
           <ul>
             ${Object.entries(results).map(([type, info]) => `<li>${type}: 数量 ${info.count}, 置信度 ${info.confidence}</li>`).join('')}
           </ul>
           <p>检测时间：${new Date().toLocaleString()}</p >
         `;
         await emailService.sendCustomEmail(userZbf.email, subject, html);
       }
     } catch (e) {
      console.error('发送userZbf邮件失败:', e);
  }

    // === 只要 pythonResult.image_path 里有 runs/detect/predict/xxx.avi 或 .mp4 就拼接静态URL ===
    let resultImageUrl = '';
    if (pythonResult.image_path) {
      let origPath = pythonResult.image_path.replace(/\\/g, '/');
      const ext = path.extname(origPath).toLowerCase();
      let fileName = path.basename(origPath, ext);
      let h264FileName = `${fileName}_h264.mp4`;
      let h264FilePath = path.join(path.dirname(origPath), h264FileName);
      let absH264FilePath = path.isAbsolute(h264FilePath) ? h264FilePath : path.join(process.cwd(), h264FilePath);
      let absOrigPath = path.isAbsolute(origPath) ? origPath : path.join(process.cwd(), origPath);

      // 路径矫正：如果 image_path 是 .mp4 但实际只存在 .avi 文件，则自动切换为 .avi
      if (ext === '.mp4' && !existsSync(absOrigPath)) {
        const aviPath = origPath.replace(/\.mp4$/i, '.avi');
        const absAviPath = path.isAbsolute(aviPath) ? aviPath : path.join(process.cwd(), aviPath);
        if (existsSync(absAviPath)) {
          console.log('⚠️ image_path 指向的 mp4 不存在，自动切换为 avi:', absAviPath);
          origPath = aviPath;
          absOrigPath = absAviPath;
        }
      }

      console.log('=== 转码调试信息 ===');
      console.log('原始文件路径:', origPath);
      console.log('文件扩展名:', ext);
      console.log('文件名:', fileName);
      console.log('H264文件名:', h264FileName);
      console.log('H264文件路径:', h264FilePath);
      console.log('绝对H264路径:', absH264FilePath);
      console.log('绝对原始路径:', absOrigPath);
      console.log('原始文件是否存在:', existsSync(absOrigPath));
      console.log('H264文件是否已存在:', existsSync(absH264FilePath));
      console.log('扩展名检查 - ext === ".avi":', ext === '.avi');
      console.log('扩展名检查 - ext === ".mp4":', ext === '.mp4');
      console.log('扩展名检查 - ext.toLowerCase() === ".avi":', ext.toLowerCase() === '.avi');

      // 强制对 avi 文件进行转码，确保浏览器能播放
      if (ext.toLowerCase() === '.avi') {
        console.log('✅ 检测到 AVI 文件，强制开始转码:', absOrigPath, '->', absH264FilePath);
        
        // 用 ffmpeg 转码为 H.264，优化参数确保浏览器兼容性
        try {
          console.log('🚀 启动 ffmpeg 转码进程...');
          await new Promise((resolve, reject) => {
            const ffmpegArgs = [
              '-y',                    // 覆盖输出文件
              '-i', absOrigPath,       // 输入文件
              '-c:v', 'libx264',       // 视频编码器
              '-preset', 'fast',       // 编码预设，平衡速度和质量
              '-crf', '23',            // 恒定质量因子
              '-profile:v', 'baseline', // 兼容性最好的 profile
              '-level', '3.1',         // 兼容性级别
              '-pix_fmt', 'yuv420p',   // 像素格式，确保浏览器兼容
              '-movflags', '+faststart', // 流式播放优化
              '-an',                   // 跳过音频流
              '-avoid_negative_ts', 'make_zero', // 时间戳处理
              '-fflags', '+genpts',    // 生成时间戳
              absH264FilePath          // 输出文件
            ];
            
            console.log('📋 ffmpeg 命令参数:', ffmpegArgs);
            
            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            let ffmpegOutput = '';
            let ffmpegError = '';
            
            ffmpeg.stdout.on('data', (data) => {
              ffmpegOutput += data.toString();
            });
            
            ffmpeg.stderr.on('data', (data) => {
              ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
              console.log('🏁 ffmpeg 转码完成，退出码:', code);
              console.log('📤 ffmpeg 输出:', ffmpegOutput);
              console.log('❌ ffmpeg 错误:', ffmpegError);
              
              if (code === 0) {
                // 验证输出文件
                if (existsSync(absH264FilePath)) {
                  const stats = statSync(absH264FilePath);
                  console.log('✅ 转码成功，输出文件大小:', stats.size, '字节');
                  if (stats.size > 0) {
                    console.log('🎉 转码完全成功！');
                    resolve(code);
                  } else {
                    console.error('❌ 输出文件大小为0，转码失败');
                    reject(new Error('输出文件大小为0'));
                  }
                } else {
                  console.error('❌ 输出文件不存在，转码失败');
                  reject(new Error('输出文件不存在'));
                }
              } else {
                console.error('❌ ffmpeg 转码失败，退出码:', code);
                reject(new Error(`ffmpeg 转码失败，退出码: ${code}`));
              }
            });
            
            ffmpeg.on('error', (err) => {
              console.error('💥 ffmpeg 启动错误:', err);
              reject(err);
            });
          });
          
          console.log('AVI 转码Promise完成');
        } catch (error) {
          console.error('AVI 转码过程中发生错误:', error);
          // 转码失败时，尝试使用原始文件（但浏览器可能无法播放）
          resultImageUrl = `/api/static/runs/detect/predict/${path.basename(origPath)}`;
          console.log('转码失败，使用原始 AVI 文件（浏览器可能无法播放）:', resultImageUrl);
        }
      } else if (ext === '.mp4') {
        // 对 mp4 文件，检查是否需要转码（如果编码不是 H.264）
        if (!existsSync(absH264FilePath)) {
          console.log('检测到 MP4 文件，开始转码:', absOrigPath, '->', absH264FilePath);
          
          // 用 ffmpeg 转码为 H.264
          try {
            await new Promise((resolve, reject) => {
              const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-i', absOrigPath,
                '-c:v', 'libx264',
                '-profile:v', 'baseline',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart',
                '-an',  // 跳过音频流，避免无音频文件转码失败
                absH264FilePath
              ]);
              
              let ffmpegOutput = '';
              let ffmpegError = '';
              
              ffmpeg.stdout.on('data', (data) => {
                ffmpegOutput += data.toString();
              });
              
              ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
              });
              
              ffmpeg.on('close', (code) => {
                console.log('ffmpeg 转码完成，退出码:', code);
                console.log('ffmpeg 输出:', ffmpegOutput);
                console.log('ffmpeg 错误:', ffmpegError);
                
                if (code === 0) {
                  console.log('转码成功，检查输出文件是否存在:', existsSync(absH264FilePath));
                  resolve(code);
                } else {
                  console.error('ffmpeg 转码失败，退出码:', code);
                  reject(new Error(`ffmpeg 转码失败，退出码: ${code}`));
                }
              });
              
              ffmpeg.on('error', (err) => {
                console.error('ffmpeg 启动错误:', err);
                reject(err);
              });
            });
            
            console.log('MP4 转码Promise完成');
          } catch (error) {
            console.error('MP4 转码过程中发生错误:', error);
            // 转码失败时，使用原始文件
            resultImageUrl = `/api/static/runs/detect/predict/${path.basename(origPath)}`;
          }
        } else {
          console.log('MP4 文件已存在 H.264 版本，跳过转码');
        }
      } else {
        console.log('非视频文件，跳过转码');
      }
      
      // 如果转码成功或文件已存在，使用H264文件
      if (existsSync(absH264FilePath)) {
        resultImageUrl = `/api/static/runs/detect/predict/${h264FileName}`;
        console.log('使用H264文件:', resultImageUrl);
      } else {
        // 否则使用原始文件
        resultImageUrl = `/api/static/runs/detect/predict/${path.basename(origPath)}`;
        console.log('使用原始文件:', resultImageUrl);
      }
    } else {
      resultImageUrl = '';
      console.log('没有image_path，resultImageUrl设为空');
    }
    return NextResponse.json({ 
      results,
      resultImage: resultImageUrl,
      result_image: resultImageUrl,
      pythonResult: pythonResult // 添加原始Python结果用于调试
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}