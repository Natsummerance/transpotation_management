import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start_time = searchParams.get('start_time');
  const end_time = searchParams.get('end_time');

  if (!start_time || !end_time) {
    return NextResponse.json({ error: 'Missing start_time or end_time' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT time_new, temperature, wind_speed, precip, Humidity FROM taxi_weather_flow WHERE time_new BETWEEN ? AND ? ORDER BY time_new ASC`,
      [start_time, end_time]
    );
    return NextResponse.json({ weather: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 