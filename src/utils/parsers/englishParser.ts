import { EN_UNIT_MAP } from "../../constants/units.en";

export const parseENLine = (line) => {
  const lower = line.toLowerCase();

  let quantity = null;
  let unit = null;
  let matchedText = null;

  // Regex to match:
  // 1 1/2 tbsp, 1½ tbsp, ½ tbsp, 2 tbsp, 1-1/2 tbsp, 1-2 tbsp
  const regex =
    /((?:\d+\s+)?\d*\/?\d*|[½¼¾]|\d+(?:\.\d+)?)(?:\s*-\s*((?:\d+\s+)?\d*\/?\d*|[½¼¾]|\d+(?:\.\d+)?))?\s*((?<![a-z])(g|l)|kg|ml|tsp|tbsp|cup|clove)s?\b/i;

  const match = lower.match(regex);

  if (match) {
    // Handle range
    if (match[2]) {
      quantity = `${normalizeQuantity(match[1])}-${normalizeQuantity(match[2])}`;
    } else {
      quantity = normalizeQuantity(match[1]);
    }

    unit = EN_UNIT_MAP[match[3]];
    matchedText = match[0];
  }

  // Fallback: standalone unit without quantity
  if (!unit) {
    Object.keys(EN_UNIT_MAP).forEach((u) => {
      const regex = new RegExp(`\\b${u}\\b`, "i");
      if (regex.test(lower)) unit = EN_UNIT_MAP[u];
    });
  }

  // Default quantity
  if (!quantity) quantity = 1;

  let ingredient = line;
  if (matchedText) ingredient = ingredient.replace(matchedText, "");
  if (unit)
    ingredient = ingredient.replace(new RegExp(`\\b${unit}\\b`, "i"), "");

  return {
    quantity,
    unit,
    ingredient: ingredient.trim(),
  };
};

/**
 * Convert mixed number / fraction to decimal or preserve fraction
 * Examples:
 * "1 1/2" => 1.5
 * "1½" => 1.5
 * "½" => 0.5
 * "2" => 2
 */
const normalizeQuantity = (val) => {
  val = val.trim();

  // Handle mixed number "1 1/2"
  const mixedMatch = val.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    return whole + numerator / denominator;
  }

  // Handle unicode fraction after number "1½"
  const unicodeMatch = val.match(/^(\d+)([½¼¾])$/);
  if (unicodeMatch) {
    const map = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
    return parseInt(unicodeMatch[1], 10) + map[unicodeMatch[2]];
  }

  // Handle single unicode fraction only
  const unicodeOnly = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
  if (unicodeOnly[val]) return unicodeOnly[val];

  // Handle simple fraction "1/2"
  const fractionMatch = val.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10);
  }

  // Otherwise numeric
  return parseFloat(val);
};
