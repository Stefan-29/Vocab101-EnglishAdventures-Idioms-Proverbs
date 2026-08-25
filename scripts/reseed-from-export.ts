import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";
}

async function ensureCategory(name?: string | null, slugOverride?: string | null) {
  const nameValue = (name || "General").trim();
  const slug = slugOverride || slugify(nameValue);
  return prisma.category.upsert({
    where: { slug },
    update: { name: nameValue },
    create: { name: nameValue, slug },
  });
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("Usage: npx tsx scripts/reseed-from-export.ts <exported-seed-file.json>");
  }

  const fullPath = path.resolve(process.cwd(), inputPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const items = JSON.parse(raw) as Array<any>;

  if (!Array.isArray(items)) {
    throw new Error("The export file must contain a JSON array.");
  }

  let count = 0;

  for (const item of items) {
    const category = item.categoryName || item.categorySlug || "General";
    const categoryRecord = await ensureCategory(category, item.categorySlug || undefined);

    const payload = {
      phrase: item.phrase,
      meaning: item.meaning,
      example: item.example,
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
        create: {
          ...payload,
          type: "PROVERB",
        },
      });
    } else {
      await prisma.idiom.upsert({
        where: { phrase: item.phrase },
        update: payload,
        create: {
          ...payload,
          type: "IDIOM",
        },
      });
    }

    count += 1;
  }

  console.log(`Imported ${count} expressions from ${fullPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
