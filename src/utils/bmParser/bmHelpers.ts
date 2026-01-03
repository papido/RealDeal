type QuantityResult = {
  quantity: string | null;
  matchedText: string | null;
  forcedUnit?: string;
  unitKey?: string; // ✅ NEW
  isLeading?: boolean;
};

const FRACTION_MAP: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
};

const normalizeFraction = (value: string): number => {
  if (FRACTION_MAP[value] !== undefined) return FRACTION_MAP[value];

  if (value.includes("/")) {
    const [num, den] = value.split("/").map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const normalizeQuantity = (raw: string): number => {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 2)
    return normalizeFraction(parts[0]) + normalizeFraction(parts[1]);
  return normalizeFraction(raw);
};

export const extractQuantity = (line: string): QuantityResult => {
  const lower = line.toLowerCase();

  if (/\bsedikit\b/.test(lower)) {
    return {
      quantity: "1",
      matchedText: "sedikit",
      forcedUnit: "little",
      isLeading: true,
    };
  }

  if (/\bsetengah\b/.test(lower)) {
    return { quantity: "0.5", matchedText: "setengah", isLeading: true };
  }

  // quantity anywhere, optional range, optional unit (even stuck like 100ml)
  // not part of a word (avoid vitaminb12, etc.)
  const regex =
    /(?<![a-zA-Z])((?:\d+\s+)?(?:\d*\/?\d+|[½¼¾]|\d+(?:\.\d+)?))\s*(ml|l|g|kg|sudu besar|sudu kecil|sudu)?\b/i;

  const match = regex.exec(line);
  if (!match) {
    return { quantity: null, matchedText: null, isLeading: false };
  }

  return {
    quantity: match[1],
    matchedText: match[0],
    unitKey: match[2]?.toLowerCase(), // ✅ THIS IS THE KEY
    isLeading: match.index === 0,
  };
};
