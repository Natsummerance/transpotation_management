import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// 定义YOLO标签到病害类型的映射
const damageMapping: { [key: string]: string } = {
  D00: '纵向裂缝',
  D01: '纵向裂缝',
  D10: '横向裂缝',
  D11: '横向裂缝',
  D20: '龟裂',
  D40: '坑洼',
  // D43 和 D44 根据描述不属于这四类，暂不映射
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

    // 调用Python脚本
    const pythonProcess = spawn('python', [pythonScriptPath, '--source', imagePath, '--weights', modelPath]);

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
    });

    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    // 不删除上传的图片，保留在upload目录中

    if (exitCode !== 0) {
      console.error(`Python script error: ${scriptError}`);
      return NextResponse.json({ error: 'Failed to process image', details: scriptError }, { status: 500 });
    }

    // 解析脚本输出并分类
    let pythonResult;
    try {
      pythonResult = JSON.parse(scriptOutput.trim());
    } catch (parseError) {
      console.error('Failed to parse Python script output:', scriptOutput);
      return NextResponse.json({ error: 'Failed to parse detection results' }, { status: 500 });
    }

// 初始化结构为对象形式
const results: Record<string, { count: number; confidence: number }> = {
  '纵向裂缝': { count: 0, confidence: 0 },
  '横向裂缝': { count: 0, confidence: 0 },
  '龟裂': { count: 0, confidence: 0 },
  '坑洼': { count: 0, confidence: 0 },
};

const damageMapping: Record<string, string> = {
  'longitudinal_crack': '纵向裂缝',
  'transverse_crack': '横向裂缝',
  'alligator_crack': '龟裂',
  'pothole': '坑洼',
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

    // 从检测结果中提取标签并统计
    if (pythonResult.detections && Array.isArray(pythonResult.detections)) {
      pythonResult.detections.forEach((detection: any) => {
        const label = detection.name;
        const category = damageMapping[label];
        if (category && results.hasOwnProperty(category)) {
          (results as any)[category]++;
        }
      });
    }

    // 构建结果图片的URL路径
    const resultImagePath = pythonResult.image_path;
    let resultImageUrl = null;
    
    if (resultImagePath && await fs.access(resultImagePath).then(() => true).catch(() => false)) {
      // 将结果图片路径转换为可访问的URL
      const relativePath = path.relative(process.cwd(), resultImagePath).replace(/\\/g, '/');
      resultImageUrl = `/${relativePath}`;
    }

    return NextResponse.json({ 
      results,
      originalImage: `/RDD_yolo11/upload/${fileName}`,
      resultImage: resultImageUrl
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}