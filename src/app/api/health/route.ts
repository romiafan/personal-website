import { NextResponse } from 'next/server';

// Simple health check endpoint
// Returns build timestamp and uptime estimation (in ms since process start) for monitoring.
// Future extension: include Convex connectivity or dependency status.
const buildTime = process.env.BUILD_TIME || new Date().toISOString();

export function GET() {
  return NextResponse.json({
    status: 'ok',
    buildTime,
    uptimeMs: Math.round(process.uptime() * 1000)
  });
}
