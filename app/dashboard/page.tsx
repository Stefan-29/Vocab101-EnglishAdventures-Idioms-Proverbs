import React from 'react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const revalidate = 0;

export default async function DashboardPage() {
  const idioms = await prisma.idiom.findMany({ take: 6, orderBy: { createdAt: 'desc' } });
  const proverbs = await prisma.proverb.findMany({ take: 6, orderBy: { createdAt: 'desc' } });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Public Dashboard</h1>
      <p style={{ marginBottom: 18 }}>Welcome to the English Adventures public dashboard. Browse featured idioms and proverbs below. To manage content, sign in.</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18 }}>Latest Idioms</h2>
        <ul>
          {idioms.map(i => (
            <li key={i.id} style={{ padding: '6px 0' }}><strong>{i.phrase}</strong> — {i.meaning}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: 18 }}>Latest Proverbs</h2>
        <ul>
          {proverbs.map(p => (
            <li key={p.id} style={{ padding: '6px 0' }}><strong>{p.phrase}</strong> — {p.meaning}</li>
          ))}
        </ul>
      </section>

      <div style={{ marginTop: 24 }}>
        <a href="/auth/signin" style={{ padding: '8px 12px', background: '#0f172a', color: 'white', borderRadius: 8, textDecoration: 'none' }}>Sign in / Sign up</a>
        <a href="/admin" style={{ marginLeft: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }}>Admin</a>
      </div>
    </main>
  );
}
