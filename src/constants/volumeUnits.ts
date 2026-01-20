export const VOLUME_UNITS = {
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  fl_oz: 29.5735,
} as const;

export type VolumeUnit = keyof typeof VOLUME_UNITS;
