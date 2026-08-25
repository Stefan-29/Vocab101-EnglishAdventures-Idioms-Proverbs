import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { idioms: true, proverbs: true } } },
    });

    return NextResponse.json({ categories: cats.map(c => ({ name: c.name, slug: c.slug, counts: c._count })) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
