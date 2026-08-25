import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parseTextItems, inferTypeFromFilename, cleanCategoryFromPath } from "../../../../lib/seed-utils";

let mammoth: any = null;
try {
  mammoth = require("mammoth");
} catch (e) {
  mammoth = null;
}

const prisma = new PrismaClient();

function authAllowed(headers: Headers) {
  const secret = process.env.ADMIN_SECRET;
  const header = headers.get("x-admin-secret");
  if (secret) return header === secret;
  return process.env.NODE_ENV !== "production";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";
}

async function ensureCategory(name?: string | null, slugOverride?: string | null) {
  const nameValue = (name || "General").trim();
  const slug = (slugOverride || slugify(nameValue)).trim();
  return prisma.category.upsert({
    where: { slug },
    update: { name: nameValue },
    create: { name: nameValue, slug },
  });
}

export async function POST(request: Request) {
  if (!authAllowed(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Support form uploads: if content-type is multipart/form-data we'll parse files
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const files: File[] = [];
      for (const entry of Array.from(formData.values() as any)) {
        if ((entry as any)?.name) files.push(entry as File);
      }

      if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

      let totalImported = 0;
      const perFile: any[] = [];

      for (const file of files) {
        const name = (file as any).name || "upload";
        const lower = name.toLowerCase();
        let text = "";

        if (lower.endsWith(".docx")) {
          if (!mammoth) return NextResponse.json({ error: "DOCX import requires 'mammoth'" }, { status: 500 });
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const res = await mammoth.extractRawText({ buffer });
          text = res?.value || "";
        } else {
          text = await file.text();
        }

        const explicitType = (formData.get("type") as string) || undefined;
        let type = explicitType?.toUpperCase() as any;
        if (!type) type = inferTypeFromFilename(name) || "IDIOM";

        const items = parseTextItems(text.replace(/\r/g, ""), type);
        if (!items.length) {
          perFile.push({ file: name, imported: 0 });
          continue;
        }

        const categoryName = cleanCategoryFromPath(name);
        const category = await ensureCategory(categoryName);

        let importedThis = 0;
        for (const item of items) {
          const thematicTagsStr = item.thematicTags ? JSON.stringify(item.thematicTags) : null;
          const exampleContextsStr = item.exampleContexts ? JSON.stringify(item.exampleContexts) : null;

          if (type === "IDIOM") {
            await prisma.idiom.upsert({
              where: { phrase: item.phrase },
              update: {
                meaning: item.meaning,
                example: item.example,
                categoryId: category.id,
                indonesianEquivalent: item.indonesianEquivalent ?? undefined,
                register: item.register ?? undefined,
                difficulty: item.difficulty ?? undefined,
                usageNotes: item.usageNotes ?? undefined,
                commonMistakes: item.commonMistakes ?? undefined,
                thematicTags: thematicTagsStr ?? undefined,
                exampleContexts: exampleContextsStr ?? undefined,
                audioUrl: item.audioUrl ?? undefined,
                source: item.source ?? undefined,
              },
              create: {
                phrase: item.phrase,
                meaning: item.meaning,
                example: item.example,
                type: "IDIOM",
                categoryId: category.id,
                indonesianEquivalent: item.indonesianEquivalent ?? null,
                register: item.register ?? null,
                difficulty: item.difficulty ?? null,
                usageNotes: item.usageNotes ?? null,
                commonMistakes: item.commonMistakes ?? null,
                thematicTags: thematicTagsStr ?? null,
                exampleContexts: exampleContextsStr ?? null,
                audioUrl: item.audioUrl ?? null,
                source: item.source ?? null,
              },
            });
          } else {
            await prisma.proverb.upsert({
              where: { phrase: item.phrase },
              update: {
                meaning: item.meaning,
                example: item.example,
                categoryId: category.id,
                indonesianEquivalent: item.indonesianEquivalent ?? undefined,
                register: item.register ?? undefined,
                difficulty: item.difficulty ?? undefined,
                usageNotes: item.usageNotes ?? undefined,
                commonMistakes: item.commonMistakes ?? undefined,
                thematicTags: thematicTagsStr ?? undefined,
                exampleContexts: exampleContextsStr ?? undefined,
                audioUrl: item.audioUrl ?? undefined,
                source: item.source ?? undefined,
              },
              create: {
                phrase: item.phrase,
                meaning: item.meaning,
                example: item.example,
                type: "PROVERB",
                categoryId: category.id,
                indonesianEquivalent: item.indonesianEquivalent ?? null,
                register: item.register ?? null,
                difficulty: item.difficulty ?? null,
                usageNotes: item.usageNotes ?? null,
                commonMistakes: item.commonMistakes ?? null,
                thematicTags: thematicTagsStr ?? null,
                exampleContexts: exampleContextsStr ?? null,
                audioUrl: item.audioUrl ?? null,
                source: item.source ?? null,
              },
            });
          }
          importedThis++;
        }

        totalImported += importedThis;
        perFile.push({ file: name, imported: importedThis });
      }

      return NextResponse.json({ success: true, totalImported, files: perFile });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : Array.isArray(body) ? body : null;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  try {
    let count = 0;

    for (const item of items) {
      if (!item || !item.phrase || !item.meaning) continue;

      const categoryRecord = await ensureCategory(item.categoryName || item.category || "General", item.categorySlug || null);
      const payload = {
        phrase: item.phrase,
        meaning: item.meaning,
        example: item.example || "",
        categoryId: categoryRecord.id,
        indonesianEquivalent: item.indonesianEquivalent ?? null,
        register: item.register ?? null,
        difficulty: item.difficulty ?? null,
        usageNotes: item.usageNotes ?? null,
        commonMistakes: item.commonMistakes ?? null,
        thematicTags: item.thematicTags ? JSON.stringify(item.thematicTags) : null,
        exampleContexts: item.exampleContexts ? JSON.stringify(item.exampleContexts) : null,
        audioUrl: item.audioUrl ?? null,
        source: item.source ?? null,
      };

      if (item.type === "PROVERB") {
        await prisma.proverb.upsert({
          where: { phrase: item.phrase },
          update: payload,
          create: { ...payload, type: "PROVERB" },
        });
      } else {
        await prisma.idiom.upsert({
          where: { phrase: item.phrase },
          update: payload,
          create: { ...payload, type: "IDIOM" },
        });
      }

      count += 1;
    }

    return NextResponse.json({ success: true, imported: count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}