import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'cars.txt');
    const content = await fs.readFile(filePath, 'utf-8');
    const carCount = parseInt(content.trim(), 10);
    return NextResponse.json({ carCount: isNaN(carCount) ? null : carCount });
  } catch (e) {
    return NextResponse.json({ carCount: null });
  }
} 