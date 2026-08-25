import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-jwt-secret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/ea_session=([^;]+)/);
    if (!match) return res.status(200).json({ user: null });
    const token = match[1];
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(200).json({ user: null });
    return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('me error', err);
    return res.status(200).json({ user: null });
  }
}
