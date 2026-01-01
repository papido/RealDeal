import { ParsedIngredient } from "@/src/constants/types";
import { BM_UNIT_MAP } from "../../constants/units.bm";
import { extractQuantity } from "./helpers";

export const parseBMLine = (line: string): ParsedIngredient => {
  const { quantity, matchedText } = extractQuantity(line);

  const unitKey = Object.keys(BM_UNIT_MAP).find((u) =>
    line.toLowerCase().includes(u)
  );

  let ingredient = line;
  if (matchedText) ingredient = ingredient.replace(matchedText, "");
  if (unitKey) ingredient = ingredient.replace(unitKey, "");

  return {
    quantity,
    unit: unitKey ? BM_UNIT_MAP[unitKey] : null,
    ingredient: ingredient.trim(),
    language: "bm",
  };
};
