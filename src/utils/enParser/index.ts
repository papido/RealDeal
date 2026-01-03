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

  if (!unit) {
    if (/\bpinch\b/i.test(line)) unit = "pinch";
    else if (/\bslices?\b/i.test(line)) unit = "slice";
    else unit = "to taste";
  }

  let ingredient =
    (parsed as any)?.description ??
    (parsed as any)?.ingredient ??
    (parsed as any)?.name ??
    null;

  if (ingredient) {
    ingredient = ingredient
      .replace(/\bslices?\b/gi, "")
      .replace(/\bpinch\b/gi, "")
      .replace(/^\s*of\s+/i, "")
      .trim();
  }

  return {
    quantity: parsed?.quantity?.toString() ?? "1",
    unit,
    ingredient,
  };
};
