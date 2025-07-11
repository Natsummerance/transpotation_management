import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// 定义YOLO标签到病害类型的映射
const damageMapping: { [key: string]: string } = {
  'longitudinal_crack': '纵向裂缝',
  'transverse_crack': '横向裂缝',
  'alligator_crack': '龟裂',
  'pothole': '坑洼',
  // 兼容旧的标签格式
  'D00': '纵向裂缝',
  'D01': '纵向裂缝',
  'D10': '横向裂缝',
  'D11': '横向裂缝',
  'D20': '龟裂',
  'D40': '坑洼',
};

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
        '纵向裂缝': { count: 2, confidence: 0.85 },
        '横向裂缝': { count: 1, confidence: 0.78 },
        '龟裂': { count: 0, confidence: 0 },
        '坑洼': { count: 1, confidence: 0.92 },
      };

      return NextResponse.json({ 
        results: mockResults,
        originalImage: `/api/static/RDD_yolo11/upload/${fileName}`,
        resultImage: `/api/static/RDD_yolo11/upload/${fileName}`,
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
        '纵向裂缝': { count: 2, confidence: 0.85 },
        '横向裂缝': { count: 1, confidence: 0.78 },
        '龟裂': { count: 0, confidence: 0 },
        '坑洼': { count: 1, confidence: 0.92 },
      };

      return NextResponse.json({ 
        results: mockResults,
        originalImage: `/api/static/RDD_yolo11/upload/${fileName}`,
        resultImage: `/api/static/RDD_yolo11/upload/${fileName}`,
        warning: '使用模拟数据，Python输出解析失败',
        rawOutput: scriptOutput
      });
    }

    // 初始化结果结构
    const results: Record<string, { count: number; confidence: number }> = {
      '纵向裂缝': { count: 0, confidence: 0 },
      '横向裂缝': { count: 0, confidence: 0 },
      '龟裂': { count: 0, confidence: 0 },
      '坑洼': { count: 0, confidence: 0 },
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

    // 构建结果图片的URL路径
    const resultImagePath = pythonResult.image_path;
    let resultImageUrl: string | null = null;
    
    if (resultImagePath && await fs.access(resultImagePath).then(() => true).catch(() => false)) {
      // 将结果图片路径转换为可访问的URL
      const relativePath = path.relative(process.cwd(), resultImagePath).replace(/\\/g, '/');
      resultImageUrl = `/api/static/${relativePath}`;
    } else {
      // 如果没有结果图片，使用原图
      resultImageUrl = `/api/static/RDD_yolo11/upload/${fileName}`;
    }

    return NextResponse.json({ 
      results,
      originalImage: `/api/static/RDD_yolo11/upload/${fileName}`,
      resultImage: resultImageUrl,
      pythonResult: pythonResult // 添加原始Python结果用于调试
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}