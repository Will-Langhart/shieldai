import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Minimal request logger for API routes (edge middleware)
export function middleware(req: NextRequest, _ev: NextFetchEvent) {
  try {
    const cid = req.headers.get('x-correlation-id') || `cid_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const url = new URL(req.url);
    const entry = {
      t: new Date().toISOString(),
      level: 'info',
      cid,
      path: url.pathname,
      method: req.method,
      ip: req.ip,
      ua: req.headers.get('user-agent') || undefined,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
    const res = NextResponse.next();
    res.headers.set('x-correlation-id', cid);
    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/api/:path*'],
};











