import { CartItem, ParsedIngredient } from "@/src/constants/types";

// Helper to normalize strings for comparison
const normalize = (str: string): string => {
  const cleaned = str
    .toLowerCase()
    .replace(/\bchilli\b/g, "chili")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(" ")
    .map((token) => {
      if (token.length > 3 && token.endsWith("s")) {
        return token.slice(0, -1);
      }
      return token;
    })
    .join(" ");
};

const tokenize = (str: string): string[] =>
  normalize(str)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const compact = (str: string): string => normalize(str).replace(/\s+/g, "");

/**
 * Extracts a set of normalized ingredient names present in the cart.
 * Checks both product names and the 'ingredients' field of products.
 */
export const getCartIngredientSet = (cartItems: CartItem[]): Set<string> => {
  const ingredientSet = new Set<string>();

  cartItems.forEach((item) => {
    if (item.product) {
      // Add the product name itself (e.g., "Milk")
      if (item.product.name) {
        ingredientSet.add(normalize(item.product.name));
      }

      // Add individual ingredients if listed in the product
      if (item.product.ingredients) {
        // Assuming ingredients are comma, semicolon, or newline separated
        const parts = item.product.ingredients.split(/[,;\n]/);
        parts.forEach((part) => {
          const clean = normalize(part);
          if (clean.length > 0) {
            ingredientSet.add(clean);
          }
        });
      }
    }
  });

  return ingredientSet;
};

/**
 * Checks if a specific ingredient is in the cart.
 * Performs fuzzy matching with tighter precision.
 */
export const isIngredientInCart = (
  ingredientName: string,
  cartIngredientSet: Set<string>
): boolean => {
  const target = normalize(ingredientName);
  if (!target) return false;

  if (cartIngredientSet.has(target)) return true;

  const targetCompact = compact(target);
  const targetTokens = new Set(tokenize(target));

  for (const cartIng of cartIngredientSet) {
    if (compact(cartIng) === targetCompact) {
      return true;
    }

    const cartTokens = new Set(tokenize(cartIng));
    const commonTokens = [...targetTokens].filter((t) => cartTokens.has(t));
    const commonCount = commonTokens.length;
    const maxSize = Math.max(targetTokens.size, cartTokens.size);

    if (targetTokens.size <= 2) {
      if (
        targetTokens.size === 2 &&
        commonCount >= 1 &&
        [...targetTokens].some((t) =>
          ["powder", "ground", "flake", "flakes"].includes(t)
        )
      ) {
        return true;
      }
      if (commonCount === targetTokens.size) return true;
      continue;
    }

    const overlapRatio = commonCount / maxSize;
    if (commonCount >= 2 && overlapRatio >= 0.6) return true;
  }

  return false;
};

/**
 * Returns a list of ingredients from the provided list that are found in the cart.
 */
export const findCartMatches = (
  ingredients: ParsedIngredient[],
  cartItems: CartItem[],
  extraIngredientNames: string[] = []
): ParsedIngredient[] => {
  const cartSet = getCartIngredientSet(cartItems);
  extraIngredientNames.forEach((name) => {
    const clean = normalize(name);
    if (clean) cartSet.add(clean);
  });

  return ingredients.filter((ing) => {
    return ing.ingredient ? isIngredientInCart(ing.ingredient, cartSet) : false;
  });
};
