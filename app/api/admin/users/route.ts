import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-jwt-secret';

async function getUserFromRequest(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const m = cookie.match(/ea_session=([^;]+)/);
    if (!m) return null;
    const token = m[1];
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    return user;
  } catch (e) {
    return null;
  }
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, role } = body || {};
  if (!id || !role) return NextResponse.json({ error: 'Missing id or role' }, { status: 400 });
  if (!['USER', 'ADMIN', 'OWNER'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const updated = await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ user: { id: updated.id, email: updated.email, role: updated.role } });
}
