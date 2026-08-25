require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL || 'stefanustankaemingk2@gmail.com';
  const password = process.env.OWNER_PASSWORD || '$T3f2110129';

  if (!email || !password) {
    console.error('OWNER_EMAIL and OWNER_PASSWORD must be set in .env or will use defaults.');
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashed,
      role: 'OWNER',
      emailVerified: new Date(),
    },
    create: {
      email,
      passwordHash: hashed,
      role: 'OWNER',
      emailVerified: new Date(),
      name: 'Owner',
    },
  });

  console.log('Owner user created or updated:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
