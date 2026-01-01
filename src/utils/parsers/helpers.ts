import { FRACTION_MAP } from "../../constants/fractions";

export const normalizeNumber = (str: string) => {
  if (FRACTION_MAP[str]) return FRACTION_MAP[str];
  return parseFloat(str);
};

export const extractQuantity = (line: string) => {
  const rangeMatch = line.match(
    /(\d+(\.\d+)?|[½¼¾])\s*(?:-|–|atau)\s*(\d+(\.\d+)?|[½¼¾])/i
  );

  if (rangeMatch) {
    return {
      quantity: `${normalizeNumber(rangeMatch[1])}-${normalizeNumber(
        rangeMatch[3]
      )}`,
      matchedText: rangeMatch[0],
    };
  }

  const singleMatch = line.match(/(\d+(\.\d+)?|[½¼¾])/);
  if (singleMatch) {
    return {
      quantity: normalizeNumber(singleMatch[1]),
      matchedText: singleMatch[0],
    };
  }

  return { quantity: null, matchedText: null };
};
