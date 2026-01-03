import { ingredientsToGrams } from "../constants/toGrams";

export const getGramsFromUnits = (
  name: string,
  unit: string,
  quantity: number
): number => {
  const allItems = [
    ...ingredientsToGrams.leafy_greens,
    ...ingredientsToGrams.vegetables,
    ...ingredientsToGrams.fruits,
    ...ingredientsToGrams.dairy_eggs,
  ];

  const item = allItems.find((i) => i.name === name && i.unit === unit);
  return item ? item.grams * quantity : 0;
};

export const getMilliltresFromUnits = {};
