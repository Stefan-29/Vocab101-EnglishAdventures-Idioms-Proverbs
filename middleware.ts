import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect admin pages and admin API routes in production when ADMIN_SECRET is set.
// Checks the x-admin-secret header or a cookie named ea_admin_secret (useful for browser access).
export function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const isAdminApi = pathname.startsWith('/api/admin');
    const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');

    const secret = process.env.ADMIN_SECRET;
    const isProd = process.env.NODE_ENV === 'production';

    if ((isAdminApi || isAdminPage) && isProd && secret) {
      const header = req.headers.get('x-admin-secret') || '';
      const cookie = req.cookies.get('ea_admin_secret')?.value || '';

      if (header !== secret && cookie !== secret) {
        if (isAdminApi) {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          });
        }

        // Return an inline locked page for browser users with guidance (avoid requiring additional routed page)
        const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin locked</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc;margin:0"><div style="max-width:680px;padding:28px;border-radius:12px;background:white;border:1px solid #e6e9ee;text-align:left;box-shadow:0 6px 20px rgba(2,6,23,0.05)"><h1 style="margin:0 0 8px 0;font-size:20px;color:#0f172a">Admin area locked</h1><p style="margin:0 0 12px 0;color:#334155">For security, the admin area is protected in production. To access it, set <code>ADMIN_SECRET</code> in your environment and provide the secret using the <code>x-admin-secret</code> request header or a cookie named <code>ea_admin_secret</code>. If you are the site owner, set the environment variable and redeploy or set the header/cookie in your admin requests.</p><div style="margin-top:12px"><a href="/" style="display:inline-block;padding:8px 12px;border-radius:8px;background:#eef2ff;color:#3730a3;text-decoration:none;border:1px solid #c7d2fe">Return to site</a></div></div></body></html>`;
        return new NextResponse(body, { status: 403, headers: { 'content-type': 'text/html' } });
      }
    }
  } catch (err) {
    // On unexpected errors, allow the request but log server-side (avoid blocking traffic due to middleware crash)
    console.error('Middleware (admin protection) error:', err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};
