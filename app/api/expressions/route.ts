import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const difficulty = url.searchParams.get("difficulty") || undefined;
  const type = url.searchParams.get("type") || undefined; // "IDIOM" | "PROVERB"
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("pageSize") || "20")));

  const skip = (page - 1) * pageSize;

  // Build basic where clauses
  const makeWhere = (baseWhere: any = {}) => {
    const where: any = { ...baseWhere };
    if (search) {
      // SQLite connector does not support the `mode` option on string filters;
      // use case-insensitive search by normalizing inputs where appropriate or rely on default behavior.
      where.OR = [
        { phrase: { contains: search } },
        { meaning: { contains: search } },
        { example: { contains: search } },
        { usageNotes: { contains: search } },
      ];
    }
    if (category) where.category = { is: { slug: category } };
    if (difficulty) where.difficulty = difficulty;
    return where;
  };

  try {
    // Fetch all matching idioms/proverbs (filters applied). For small datasets this is fine; we page in-memory.
    const [idioms, proverbs] = await Promise.all([
      prisma.idiom.findMany({ where: makeWhere(type === "PROVERB" ? { id: undefined } : {}), include: { category: true } }),
      prisma.proverb.findMany({ where: makeWhere(type === "IDIOM" ? { id: undefined } : {}), include: { category: true } }),
    ]);

    let combined = [
      ...idioms.map((i) => ({
        id: i.id,
        phrase: i.phrase,
        meaning: i.meaning,
        example: i.example,
        type: i.type,
        category: i.category?.name ?? null,
        difficulty: i.difficulty ?? null,
        indonesianEquivalent: i.indonesianEquivalent ?? null,
        usageNotes: i.usageNotes ?? null,
        createdAt: i.createdAt,
      })),
      ...proverbs.map((p) => ({
        id: p.id,
        phrase: p.phrase,
        meaning: p.meaning,
        example: p.example,
        type: p.type,
        category: p.category?.name ?? null,
        difficulty: p.difficulty ?? null,
        indonesianEquivalent: p.indonesianEquivalent ?? null,
        usageNotes: p.usageNotes ?? null,
        createdAt: p.createdAt,
      })),
    ];

    // sort by createdAt desc
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = combined.length;
    const start = skip;
    const pageItems = combined.slice(start, start + pageSize).map(({ createdAt, ...rest }) => rest);

    return NextResponse.json({ items: pageItems, total, page, pageSize });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load expressions" }, { status: 500 });
  } finally {
    // do not disconnect here; reuse client
  }
}
