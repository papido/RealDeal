// src/utils/enParser/index.ts
import { parseIngredient } from "parse-ingredient";

type ParsedIngredient = {
  quantity?: string | null;
  unit?: string | null;
  ingredient?: string | null;
};

export const parseENLine = (line: string): ParsedIngredient => {
  const results = parseIngredient(line);
  const parsed = results[0];

  let unit = (parsed as any)?.unitOfMeasure ?? (parsed as any)?.unit;
  const hasToTaste = /\bto taste\b/i.test(line);
  const gramMatch = line.match(/(\d+(?:\.\d+)?)\s*(g|grams?|gram)\b/i);

  if (unit && /\b(small|large)\b/i.test(unit)) {
    unit = "piece";
  }

  if (!unit) {
    if (/\bpinch\b/i.test(line)) unit = "pinch";
    else if (/\bslices?\b/i.test(line)) unit = "slice";
    else if (hasToTaste) unit = "to taste";
    else unit = "piece";
  }

  let ingredient =
    (parsed as any)?.description ??
    (parsed as any)?.ingredient ??
    (parsed as any)?.name ??
    null;

  if (hasToTaste && unit && !/\bto taste\b/i.test(unit)) {
    unit = `${unit} to taste`;
  }

  if (ingredient) {
    ingredient = ingredient
      .replace(/\b(small|large)\b/gi, "")
      .replace(/\bslices?\b/gi, "")
      .replace(/\bpinch\b/gi, "")
      .replace(/\bto taste\b/gi, "")
      .replace(/\b\d+(?:\.\d+)?\s*(g|grams?|gram)\b/gi, "")
      .replace(/^\s*of\s+/i, "")
      .trim();
  }

  return {
    quantity: gramMatch?.[1] ?? parsed?.quantity?.toString() ?? "1",
    unit: gramMatch ? "g" : unit,
    ingredient,
  };
};
