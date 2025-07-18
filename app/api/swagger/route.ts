import { NextResponse } from 'next/server';
import swaggerSpec from '../../../swagger';

export async function GET() {
  return NextResponse.json(swaggerSpec);
} 