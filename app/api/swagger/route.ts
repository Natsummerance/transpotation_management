import { NextResponse } from 'next/server';
const swaggerSpec = require('../../../swagger');

export async function GET() {
  return NextResponse.json(swaggerSpec);
} 