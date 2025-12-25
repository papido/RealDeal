export type Unit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "oz"
  | "gallon"
  | "each"
  | "qt"
  | "pt"
  | "fl oz"
  | "lb";

// Conversion factors to base units (g for mass, ml for volume)
const CONVERSION_FACTORS = {
  // Mass to grams (g)
  g: 1,
  kg: 1000,
  lb: 453.592, // Pound

  // Volume to milliliters (ml)
  ml: 1,
  l: 1000,
  oz: 29.5735, // US fluid ounce
  "fl oz": 29.5735, // US fluid ounce
  qt: 946.353, // US liquid quart
  pt: 473.176, // US liquid pint
  gallon: 3785.41, // US liquid gallon
};

interface ConvertedIngredient {
  weight: number;
  unit: string;
}

/**
 * Converts ingredient weight to a standard base unit (g or ml).
 * 'each' unit is passed through without conversion.
 * @param weight The weight/volume value from user input.
 * @param unit The unit from user input.
 * @returns An object with the converted weight and the new base unit.
 */
export const convertIngredient = (
  weight: number,
  unit: Unit
): ConvertedIngredient => {
  if (isNaN(weight)) {
    // If weight is not a number (e.g., empty input), default to 0.
    return { weight: 0, unit };
  }

  switch (unit) {
    case "kg":
      return { weight: weight * CONVERSION_FACTORS.kg, unit: "g" };
    case "lb":
      return { weight: weight * CONVERSION_FACTORS.lb, unit: "g" };
    case "l":
      return { weight: weight * CONVERSION_FACTORS.l, unit: "ml" };
    case "oz":
      return { weight: weight * CONVERSION_FACTORS.oz, unit: "ml" };
    case "fl oz":
      return { weight: weight * CONVERSION_FACTORS["fl oz"], unit: "ml" };
    case "qt":
      return { weight: weight * CONVERSION_FACTORS.qt, unit: "ml" };
    case "pt":
      return { weight: weight * CONVERSION_FACTORS.pt, unit: "ml" };
    case "gallon":
      return { weight: weight * CONVERSION_FACTORS.gallon, unit: "ml" };
    case "g":
    case "ml":
    case "each":
      return { weight, unit };
    default:
      return { weight, unit };
  }
};

/**
 * Converts a weight from base unit (g or ml) back to a specific unit for display.
 * @param weightInBase The weight in base unit (g or ml).
 * @param targetUnit The unit to convert back to.
 * @returns The weight in the target unit.
 */
export const convertWeightFromBase = (
  weightInBase: number,
  targetUnit: Unit
): number => {
  if (targetUnit === "g" || targetUnit === "ml" || targetUnit === "each") {
    return weightInBase;
  }
  const factor =
    CONVERSION_FACTORS[targetUnit as keyof typeof CONVERSION_FACTORS];
  return factor ? weightInBase / factor : weightInBase;
};
