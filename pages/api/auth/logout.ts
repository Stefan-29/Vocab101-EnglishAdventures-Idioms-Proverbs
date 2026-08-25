import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Set-Cookie', `ea_session=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  return res.json({ ok: true });
}
