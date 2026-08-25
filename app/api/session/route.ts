import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getInitialSrsState, scheduleReview } from "@/lib/srs";

const prisma = new PrismaClient();

const reviewSchema = z.object({
  itemId: z.string().min(1),
  rating: z.number().min(0).max(5),
});

const userId = "demo-user";

function normalizeItem(item: any, type: "IDIOM" | "PROVERB") {
  return {
    id: item.id,
    phrase: item.phrase,
    meaning: item.meaning,
    example: item.example,
    type,
    category: item.category?.name ?? null,
    userProgress: item.userProgress?.[0] ?? null,
  };
}

export async function GET() {
  const now = new Date();

  const [dueIdioms, dueProverbs, noProgressIdioms, noProgressProverbs] = await Promise.all([
    prisma.idiom.findMany({
      where: {
        userProgress: {
          some: {
            userId,
            dueAt: { lte: now },
          },
        },
      },
      include: {
        category: true,
        userProgress: {
          where: { userId },
        },
      },
    }),
    prisma.proverb.findMany({
      where: {
        userProgress: {
          some: {
            userId,
            dueAt: { lte: now },
          },
        },
      },
      include: {
        category: true,
        userProgress: {
          where: { userId },
        },
      },
    }),
    prisma.idiom.findMany({
      where: {
        userProgress: {
          none: { userId },
        },
      },
      include: {
        category: true,
        userProgress: {
          where: { userId },
        },
      },
    }),
    prisma.proverb.findMany({
      where: {
        userProgress: {
          none: { userId },
        },
      },
      include: {
        category: true,
        userProgress: {
          where: { userId },
        },
      },
    }),
  ]);

  const dueItems = [
    ...dueIdioms.map((item) => normalizeItem(item, "IDIOM")),
    ...dueProverbs.map((item) => normalizeItem(item, "PROVERB")),
  ];

  if (dueItems.length > 0) {
    return NextResponse.json({ item: dueItems[0] });
  }

  const fallbackItems = [
    ...noProgressIdioms.map((item) => normalizeItem(item, "IDIOM")),
    ...noProgressProverbs.map((item) => normalizeItem(item, "PROVERB")),
  ];

  if (fallbackItems.length > 0) {
    return NextResponse.json({ item: fallbackItems[0] });
  }

  return NextResponse.json({ item: null }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { itemId, rating } = parsed.data;

  const [idiom, proverb] = await Promise.all([
    prisma.idiom.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        userProgress: {
          where: { userId },
        },
      },
    }),
    prisma.proverb.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        userProgress: {
          where: { userId },
        },
      },
    }),
  ]);

  const item = idiom ?? proverb;

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const isIdiom = Boolean(idiom);
  const existing = item.userProgress[0] ?? null;

  const previousState = existing
    ? {
        repetitions: existing.repetitions,
        interval: existing.interval,
        easeFactor: existing.easeFactor,
        dueAt: existing.dueAt,
        lastReviewedAt: existing.lastReviewedAt ?? existing.dueAt,
      }
    : getInitialSrsState();

  const updated = scheduleReview(
    previousState,
    Number(rating) as 0 | 1 | 2 | 3 | 4 | 5,
    new Date()
  );

  const payload = {
    userId,
    repetitions: updated.repetitions,
    interval: updated.interval,
    easeFactor: updated.easeFactor,
    dueAt: updated.nextDueAt,
    lastReviewedAt: updated.lastReviewedAt,
    correctCount: rating >= 3 ? (existing?.correctCount ?? 0) + 1 : existing?.correctCount ?? 0,
    incorrectCount: rating < 3 ? (existing?.incorrectCount ?? 0) + 1 : existing?.incorrectCount ?? 0,
    isMastered: rating >= 4,
  };

  const saved = isIdiom
    ? await prisma.userProgress.upsert({
        where: {
          userId_idiomId: {
            userId,
            idiomId: item.id,
          },
        },
        update: payload,
        create: {
          ...payload,
          idiomId: item.id,
        },
      })
    : await prisma.userProgress.upsert({
        where: {
          userId_proverbId: {
            userId,
            proverbId: item.id,
          },
        },
        update: payload,
        create: {
          ...payload,
          proverbId: item.id,
        },
      });

  return NextResponse.json(saved);
}