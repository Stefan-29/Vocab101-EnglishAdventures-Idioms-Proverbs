import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedType = "IDIOM" | "PROVERB";

const DATA_DIR = path.join(process.cwd(), "public", "data");

// Matches:
// 1. phrase
// Meaning: ...
// Example: "..."
// Also allows extra spaces from Word documents.
const ITEM_REGEX =
  /(\d+)\.\s+(.+?)\s*\n\s*Meaning:\s+([\s\S]+?)\s*\n\s*Example:\s+["“]?([\s\S]+?)["”]?\s*(?=\n\s*\d+\.|\nPractice Time|\nAnswer Key|$)/gi;

function cleanCategory(input: string): string {
  let cleaned = path.basename(input, path.extname(input));

  // Convert separators to spaces
  cleaned = cleaned.replace(/[_-]+/g, " ");

  // Split camelCase: angerIdioms -> anger Idioms
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Remove common filename words
  cleaned = cleaned.replace(
    /\b(module|material|about|the|of|and|idioms?|proverbs?)\b/gi,
    " "
  );

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  if (!cleaned) return "General";

  return cleaned
    .split(" ")
    .map((word) => {
      if (!word) return "";

      // Preserve short categories like A, CDE
      if (word.length <= 3) {
        return word.toUpperCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function inferType(filePath: string): SeedType | null {
  const lower = filePath.toLowerCase();

  if (lower.includes("proverb")) return "PROVERB";
  if (lower.includes("idiom")) return "IDIOM";

  return null;
}

async function ensureCategory(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

function parseItems(filePath: string, type: SeedType) {
  const content = fs
    .readFileSync(filePath, "utf8")
    .replace(/\r/g, "")
    .replace(/^\uFEFF/, "");

  const matches = Array.from(content.matchAll(ITEM_REGEX));

  return matches.map((match) => {
    // match[0] contains the full captured block for the item
    const block = match[0];

    const extract = (label: string) => {
      const re = new RegExp(label + "\\s*:\\s*(.+)", "i");
      const m = block.match(re);
      return m ? m[1].trim() : null;
    };

    const tagsRaw = extract("Tags") || extract("Tag");
    const contextsRaw = extract("Contexts") || extract("Context");

    const parseList = (raw: string | null) => {
      if (!raw) return null;
      try {
        // If looks like JSON array, parse
        if (/^\s*\[/.test(raw)) return JSON.parse(raw);
      } catch {}
      // fallback: comma-separated
      return raw.split(/\s*,\s*/).filter(Boolean);
    };

    return {
      number: Number(match[1]),
      phrase: match[2].trim(),
      meaning: match[3].trim(),
      example: match[4].trim(),
      type,
      indonesianEquivalent: extract("Indonesian") || extract("Indonesian equivalent") || null,
      register: extract("Register") || null,
      difficulty: extract("Difficulty") || null,
      usageNotes: extract("UsageNotes") || extract("Usage Notes") || null,
      commonMistakes: extract("CommonMistakes") || extract("Common Mistakes") || null,
      thematicTags: parseList(tagsRaw),
      exampleContexts: parseList(contextsRaw),
      audioUrl: extract("Audio") || null,
      source: extract("Source") || null,
    };
  });
}

async function seedFile(filePath: string, type: SeedType) {
  const categoryName = cleanCategory(filePath);
  const items = parseItems(filePath, type);

  if (!items.length) {
    console.warn(`⚠️ No valid items found in ${filePath}`);
    return 0;
  }

  const category = await ensureCategory(categoryName);

  for (const item of items) {
    // Prepare fields that may be optional in the parsed item
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
  }

  return items.length;
}

async function main() {
  const [inputPath, typeArg] = process.argv.slice(2);

  // If a file path is passed manually, use it.
  if (inputPath) {
    const explicitType = typeArg?.toUpperCase();

    let type: SeedType | null = null;

    if (explicitType === "IDIOM" || explicitType === "PROVERB") {
      type = explicitType;
    } else {
      type = inferType(inputPath);
    }

    if (!type) {
      throw new Error(
        "Could not determine type. Pass IDIOM or PROVERB as the second argument."
      );
    }

    const count = await seedFile(inputPath, type);
    console.log(
      `Seeded ${count} ${type.toLowerCase()} items from ${inputPath}`
    );

    return;
  }

  // Otherwise, automatically scan public/data.
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(
      `Folder not found: ${DATA_DIR}. Create it and add your .txt files there.`
    );
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((file) => file.toLowerCase().endsWith(".txt"))
    .map((file) => path.join(DATA_DIR, file));

  if (!files.length) {
    throw new Error(`No .txt files found in ${DATA_DIR}`);
  }

  let total = 0;

  for (const filePath of files) {
    const type = inferType(filePath);

    if (!type) {
      console.log(
        `⏭️ Skipping ${filePath} — filename must include "idiom" or "proverb".`
      );
      continue;
    }

    const count = await seedFile(filePath, type);

    console.log(
      `📖 Seeded ${count} ${type.toLowerCase()} items from ${filePath}`
    );

    total += count;
  }

  console.log(`✅ Total seeded: ${total}`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });