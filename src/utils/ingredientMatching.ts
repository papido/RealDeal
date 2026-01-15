import { CartItem, ParsedIngredient } from "@/src/constants/types";

// Helper to normalize strings for comparison
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (str: string): string[] =>
  normalize(str)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

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
 * Performs exact and partial matching.
 */
export const isIngredientInCart = (
  ingredientName: string,
  cartIngredientSet: Set<string>
): boolean => {
  const target = normalize(ingredientName);
  if (!target) return false;

  // 1. Direct match
  if (cartIngredientSet.has(target)) return true;

  // 2. Partial match (fuzzy)
  // Check if the target ingredient is contained in any cart item string or vice versa
  // e.g. target="onion" matches cart="red onion"
  for (const cartIng of cartIngredientSet) {
    if (cartIng.includes(target) || target.includes(cartIng)) {
      return true;
    }

    // 3. Word overlap (handles re-ordered or punctuated strings)
    const cartTokens = tokenize(cartIng);
    const targetTokens = tokenize(target);
    if (
      cartTokens.some(
        (token) => token.length > 2 && targetTokens.includes(token)
      )
    ) {
      return true;
    }
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
