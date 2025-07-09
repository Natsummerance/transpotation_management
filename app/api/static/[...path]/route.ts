import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = path.join(process.cwd(), ...params.path);
    
    // 安全检查：确保文件路径在项目目录内
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(projectRoot)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // 检查是否为文件（不是目录）
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }
    
    // 读取文件
    const fileBuffer = fs.readFileSync(resolvedPath);
    
    // 根据文件扩展名设置Content-Type
    const ext = path.extname(resolvedPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    
  } catch (error) {
    console.error('Static file serve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}