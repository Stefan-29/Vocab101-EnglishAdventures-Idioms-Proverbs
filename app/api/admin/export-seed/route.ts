import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function authAllowed(headers: Headers) {
  const secret = process.env.ADMIN_SECRET;
  const header = headers.get("x-admin-secret");
  if (secret) return header === secret;
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  if (!authAllowed(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { ids, since } = body as any;

  try {
    const whereIds = ids && Array.isArray(ids) && ids.length > 0;
    const sinceDate = since ? new Date(since) : null;

    const idiomWhere: any = {};
    const proverbWhere: any = {};

    if (whereIds) {
      idiomWhere.id = { in: ids };
      proverbWhere.id = { in: ids };
    } else if (sinceDate) {
      idiomWhere.createdAt = { gte: sinceDate };
      proverbWhere.createdAt = { gte: sinceDate };
    }

    const [idioms, proverbs] = await Promise.all([
      prisma.idiom.findMany({ where: idiomWhere, include: { category: true } }),
      prisma.proverb.findMany({ where: proverbWhere, include: { category: true } }),
    ]);

    const items = [
      ...idioms.map((i) => ({
        id: i.id,
        type: i.type,
        phrase: i.phrase,
        meaning: i.meaning,
        example: i.example,
        categoryId: i.categoryId,
        categoryName: i.category?.name ?? null,
        categorySlug: i.category?.slug ?? null,
        indonesianEquivalent: i.indonesianEquivalent,
        register: i.register,
        difficulty: i.difficulty,
        usageNotes: i.usageNotes,
        commonMistakes: i.commonMistakes,
        thematicTags: i.thematicTags ? JSON.parse(i.thematicTags) : null,
        exampleContexts: i.exampleContexts ? JSON.parse(i.exampleContexts) : null,
        audioUrl: i.audioUrl,
        source: i.source,
      })),
      ...proverbs.map((p) => ({
        id: p.id,
        type: p.type,
        phrase: p.phrase,
        meaning: p.meaning,
        example: p.example,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        categorySlug: p.category?.slug ?? null,
        indonesianEquivalent: p.indonesianEquivalent,
        register: p.register,
        difficulty: p.difficulty,
        usageNotes: p.usageNotes,
        commonMistakes: p.commonMistakes,
        thematicTags: p.thematicTags ? JSON.parse(p.thematicTags) : null,
        exampleContexts: p.exampleContexts ? JSON.parse(p.exampleContexts) : null,
        audioUrl: p.audioUrl,
        source: p.source,
      })),
    ];

    // Write file to scripts/ for convenience
    const filename = `exported-seed-${Date.now()}.json`;
    const scriptsDir = path.resolve(process.cwd(), "scripts");
    try {
      if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(scriptsDir, filename), JSON.stringify(items, null, 2), { encoding: "utf-8" });
    } catch (err) {
      console.error("Failed to write seed file:", err);
    }

    return NextResponse.json({ count: items.length, filename, items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
