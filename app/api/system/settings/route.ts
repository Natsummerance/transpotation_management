import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const configDir = join(process.cwd(), 'public', 'config');
const configPath = join(configDir, 'settings.json');

export async function GET() {
  try {
    // 读取配置文件
    const data = await readFile(configPath, 'utf-8');
    return NextResponse.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    // 文件不存在时返回默认配置
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json({ success: true, data: {} });
    }
    return NextResponse.json({ success: false, message: '读取系统设置失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: '系统设置保存成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '保存系统设置失败' }, { status: 500 });
  }
} 