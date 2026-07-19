import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const adminPrefix = '/admin';

export async function middleware(req: any) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith(adminPrefix)) return NextResponse.next();
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.redirect(new URL(`/cuenta/login?callbackUrl=${encodeURIComponent(url.pathname)}`, url.origin));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
