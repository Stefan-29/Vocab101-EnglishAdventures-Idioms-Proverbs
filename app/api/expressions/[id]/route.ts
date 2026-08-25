import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseJsonField(val?: string | null) {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    // fallback: comma-separated
    return val.split(/\s*,\s*/).filter(Boolean);
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const id = params.id;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const [idiom, proverb] = await Promise.all([
      prisma.idiom.findUnique({ where: { id }, include: { category: true } }),
      prisma.proverb.findUnique({ where: { id }, include: { category: true } }),
    ]);

    const item = idiom ?? proverb;
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const payload = {
      id: item.id,
      phrase: item.phrase,
      meaning: item.meaning,
      example: item.example,
      type: item.type,
      category: item.category?.name ?? null,
      indonesianEquivalent: item.indonesianEquivalent ?? null,
      register: item.register ?? null,
      difficulty: item.difficulty ?? null,
      usageNotes: item.usageNotes ?? null,
      commonMistakes: item.commonMistakes ?? null,
      thematicTags: parseJsonField(item.thematicTags),
      exampleContexts: parseJsonField(item.exampleContexts),
      audioUrl: item.audioUrl ?? null,
      source: item.source ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load expression" }, { status: 500 });
  }
}
