import { ParsedIngredient } from "@/src/constants/types";
import { BM_UNIT_MAP } from "../../constants/units.bm";
import { extractQuantity } from "./bmHelpers";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseBMLine = (line: string): ParsedIngredient => {
  const {
    quantity,
    matchedText,
    forcedUnit,
    unitKey: extractedUnit,
    isLeading,
  } = extractQuantity(line);

  // detect unit ONLY if explicitly present (word boundary)
  const unitKey =
    extractedUnit ??
    Object.keys(BM_UNIT_MAP)
      .sort((a, b) => b.length - a.length)
      .find((u) =>
        new RegExp(`(?<![a-zA-Z])${escapeRegExp(u)}\\b`, "i").test(line)
      ) ??
    null;

  let ingredient = line;

  // remove matched text (numbers OR "sedikit") case-insensitive
  if (matchedText) {
    ingredient = ingredient.replace(
      new RegExp(escapeRegExp(matchedText), "ig"),
      ""
    );
  }

  // remove unit word if found
  if (unitKey) {
    ingredient = ingredient.replace(
      new RegExp(`\\b${escapeRegExp(unitKey)}\\b`, "ig"),
      ""
    );
  }

  ingredient = ingredient.replace(/\s{2,}/g, " ").trim();

  // ✅ quantity is “real” if:
  // - it’s at the start, OR
  // - it’s paired with a unit somewhere
  const hasExplicitQuantity =
    quantity !== null && (isLeading || unitKey !== null);

  const finalQuantity = hasExplicitQuantity ? quantity! : "1";

  const finalUnit =
    forcedUnit ??
    (unitKey
      ? BM_UNIT_MAP[unitKey as keyof typeof BM_UNIT_MAP]
      : hasExplicitQuantity
        ? "each"
        : "to taste");

  return {
    quantity: finalQuantity,
    unit: finalUnit,
    ingredient,
  };
};
