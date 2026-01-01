import { BM_UNIT_MAP } from "../../constants/units.bm";
import { parseBMLine } from "./bmParser";
import { parseENLine } from "./englishParser";

export const parseLine = (line: string) => {
  const isBM = Object.keys(BM_UNIT_MAP).some((u) =>
    line.toLowerCase().includes(u)
  );

  return isBM ? parseBMLine(line) : parseENLine(line);
};
