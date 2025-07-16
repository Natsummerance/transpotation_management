import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // 修正：加上 'RDD_yolo11' 目录
    const filePath = path.join(process.cwd(), 'RDD_yolo11', ...params.path);
    
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
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.avi':
        contentType = 'video/x-msvideo';
        break;
      case '.mov':
        contentType = 'video/quicktime';
        break;
      case '.webm':
        contentType = 'video/webm';
        break;
      case '.ogg':
        contentType = 'video/ogg';
        break;
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
      case '.m4v':
        contentType = 'video/mp4';
        break;
      case '.m3u8':
        contentType = 'application/vnd.apple.mpegurl';
        break;
      case '.ts':
        contentType = 'video/mp2t';
        break;
    }

    // 检查是否为视频/音频类型，决定是否处理Range
    const isMedia = contentType.startsWith('video/') || contentType.startsWith('audio/');
    const range = req.headers.get('range');
    if (isMedia && range) {
      const total = stats.size;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= total) {
        return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
      }
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(resolvedPath, { start, end });
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      };
      // @ts-ignore
      return new NextResponse(file, { status: 206, headers });
    } else {
      // 非Range请求，返回整个文件
      const fileBuffer = fs.readFileSync(resolvedPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    }
    
  } catch (error) {
    console.error('Static file serve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
