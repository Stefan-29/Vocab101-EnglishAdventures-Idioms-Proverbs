import path from "path";

export type SeedType = "IDIOM" | "PROVERB";

// Matches numbered items with Meaning: and Example: labels. Non-greedy and supports multi-line meaning/example.
const ITEM_REGEX = /(\d+)\.\s+(.+?)\s*\n\s*Meaning:\s+([\s\S]+?)\s*\n\s*Example:\s+["“]?([\s\S]+?)["”]?\s*(?=\n\s*\d+\.|\nPractice Time|\nAnswer Key|$)/gi;

export function cleanCategoryFromPath(input: string): string {
  let cleaned = path.basename(input, path.extname(input));
  cleaned = cleaned.replace(/[_-]+/g, " ");
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, "$1 $2");
  cleaned = cleaned.replace(/\b(module|material|about|the|of|and|idioms?|proverbs?)\b/gi, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (!cleaned) return "General";
  return cleaned
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.length <= 3) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function inferTypeFromFilename(filePath: string): SeedType | null {
  const lower = filePath.toLowerCase();
  if (lower.includes("proverb")) return "PROVERB";
  if (lower.includes("idiom")) return "IDIOM";
  return null;
}

function parseList(raw: string | null) {
  if (!raw) return null;
  try {
    if (/^\s*\[/.test(raw)) return JSON.parse(raw);
  } catch {}
  return raw.split(/\s*,\s*/).filter(Boolean);
}

export function parseTextItems(content: string, type: SeedType): Array<any> {
  const matches = Array.from(content.matchAll(ITEM_REGEX));
  return matches.map((match) => {
    const block = match[0];
    const extract = (label: string) => {
      const re = new RegExp(label + "\\s*:\\s*(.+)", "i");
      const m = block.match(re);
      return m ? m[1].trim() : null;
    };
    const tagsRaw = extract("Tags") || extract("Tag");
    const contextsRaw = extract("Contexts") || extract("Context");
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
