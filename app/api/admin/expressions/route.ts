import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function authAllowed(headers: Headers) {
  const secret = process.env.ADMIN_SECRET;
  const header = headers.get("x-admin-secret");
  if (secret) return header === secret;
  // allow when not in production to simplify local dev
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  if (!authAllowed(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const {
    id,
    phrase,
    meaning,
    example,
    type = "IDIOM",
    categorySlug,
    indonesianEquivalent,
    register,
    difficulty,
    usageNotes,
    commonMistakes,
    thematicTags,
    exampleContexts,
    audioUrl,
    source,
  } = body as any;

  if (!phrase || !meaning) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    let categoryId: string | null = null;
    if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) categoryId = cat.id;
    }

    const thematicTagsStr = thematicTags ? JSON.stringify(thematicTags) : null;
    const exampleContextsStr = exampleContexts ? JSON.stringify(exampleContexts) : null;

    if (id) {
      // update existing (try idiom then proverb)
      const existingIdiom = await prisma.idiom.findUnique({ where: { id } });
      if (existingIdiom) {
        const updated = await prisma.idiom.update({
          where: { id },
          data: {
            phrase,
            meaning,
            example,
            categoryId,
            indonesianEquivalent: indonesianEquivalent ?? null,
            register: register ?? null,
            difficulty: difficulty ?? null,
            usageNotes: usageNotes ?? null,
            commonMistakes: commonMistakes ?? null,
            thematicTags: thematicTagsStr ?? null,
            exampleContexts: exampleContextsStr ?? null,
            audioUrl: audioUrl ?? null,
            source: source ?? null,
          },
        });
        return NextResponse.json(updated);
      }

      const existingProverb = await prisma.proverb.findUnique({ where: { id } });
      if (existingProverb) {
        const updated = await prisma.proverb.update({
          where: { id },
          data: {
            phrase,
            meaning,
            example,
            categoryId,
            indonesianEquivalent: indonesianEquivalent ?? null,
            register: register ?? null,
            difficulty: difficulty ?? null,
            usageNotes: usageNotes ?? null,
            commonMistakes: commonMistakes ?? null,
            thematicTags: thematicTagsStr ?? null,
            exampleContexts: exampleContextsStr ?? null,
            audioUrl: audioUrl ?? null,
            source: source ?? null,
          },
        });
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // create new
    if (type === "PROVERB") {
      const created = await prisma.proverb.create({
        data: {
          phrase,
          meaning,
          example,
          type: "PROVERB",
          categoryId,
          indonesianEquivalent: indonesianEquivalent ?? null,
          register: register ?? null,
          difficulty: difficulty ?? null,
          usageNotes: usageNotes ?? null,
          commonMistakes: commonMistakes ?? null,
          thematicTags: thematicTagsStr ?? null,
          exampleContexts: exampleContextsStr ?? null,
          audioUrl: audioUrl ?? null,
          source: source ?? null,
        },
      });
      return NextResponse.json(created);
    }

    const created = await prisma.idiom.create({
      data: {
        phrase,
        meaning,
        example,
        type: "IDIOM",
        categoryId,
        indonesianEquivalent: indonesianEquivalent ?? null,
        register: register ?? null,
        difficulty: difficulty ?? null,
        usageNotes: usageNotes ?? null,
        commonMistakes: commonMistakes ?? null,
        thematicTags: thematicTagsStr ?? null,
        exampleContexts: exampleContextsStr ?? null,
        audioUrl: audioUrl ?? null,
        source: source ?? null,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upsert" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!authAllowed(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // Try delete idiom, then proverb
    const idiom = await prisma.idiom.findUnique({ where: { id } });
    if (idiom) {
      await prisma.idiom.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const proverb = await prisma.proverb.findUnique({ where: { id } });
    if (proverb) {
      await prisma.proverb.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
