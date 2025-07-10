import { NextResponse } from "next/server"

// Fake system metrics – replace with real data source when available
export async function GET() {
  return NextResponse.json({
    status: "ok",
    cpu: 42, // %
    memory: 63, // %
    uptime: 3_600, // seconds
    timestamp: Date.now(),
  })
}
