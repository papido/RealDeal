import ingredientsJson from "../constants/ingredients.json";
import { Ingredient, IngredientsByCategory } from "../constants/types";
import { VOLUME_UNITS, VolumeUnit } from "../constants/volumeUnits";

const ingredients = ingredientsJson as IngredientsByCategory;

const findIngredient = (ingredientKey: string): Ingredient | null => {
  for (const category of Object.values(ingredients)) {
    const item = category[ingredientKey];
    if (item) return item;
  }
  return null;
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
