import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcrypt';
import type { NextAuthOptions } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        // return object that will be added to session.user
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
  ],
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user, token }) {
      // attach role and id
      try {
        if (user) {
          (session as any).user = (session as any).user || {};
          (session as any).user.role = (user as any).role || 'USER';
          (session as any).user.id = (user as any).id;
        } else if (token) {
          (session as any).user = (session as any).user || {};
          (session as any).user.role = (token as any).role || (session as any).user.role || 'USER';
        }
      } catch (e) {
        // ignore
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-secret',
};

export default authOptions;