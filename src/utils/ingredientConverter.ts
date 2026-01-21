import ingredientsJson from "../constants/ingredients.json";
import { Ingredient, IngredientsByCategory } from "../constants/types";
import { VOLUME_UNITS, VolumeUnit } from "../constants/volumeUnits";

const ingredients = ingredientsJson as IngredientsByCategory;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const findIngredient = (ingredientKey: string): Ingredient | null => {
  for (const category of Object.values(ingredients)) {
    const item = category[ingredientKey];
    if (item) return item;
  }
  return null;
};

export const findIngredientKeyByName = (ingredientName: string): string | null => {
  const normalized = normalize(ingredientName);
  if (!normalized) return null;

  let bestKey: string | null = null;
  let bestLength = 0;

  for (const category of Object.values(ingredients)) {
    for (const [key, item] of Object.entries(category)) {
      const labelNormalized = normalize(item.label);
      const keyNormalized = normalize(key.replace(/_/g, " "));

      if (labelNormalized === normalized || keyNormalized === normalized) {
        return key;
      }

      if (
        normalized.includes(labelNormalized) ||
        labelNormalized.includes(normalized) ||
        normalized.includes(keyNormalized) ||
        keyNormalized.includes(normalized)
      ) {
        const matchLength = Math.max(labelNormalized.length, keyNormalized.length);
        if (matchLength > bestLength) {
          bestKey = key;
          bestLength = matchLength;
        }
      }
    }
  }

  return bestKey;
};

export const convertIngredient = (
  ingredientKey: string,
  amount: number,
  unit: VolumeUnit
) => {
  const item = findIngredient(ingredientKey);
  if (!item) return null;

  const volumeInMl = amount * VOLUME_UNITS[unit];

  if (item.state === "liquid") {
    const mlValue = Math.round(volumeInMl);
    return { value: mlValue, unit: "ml" as const, display: `${mlValue} ml` };
  }

  const gramsValue = Math.round(volumeInMl * item.density);
  return { value: gramsValue, unit: "g" as const, display: `${gramsValue} g` };
};
