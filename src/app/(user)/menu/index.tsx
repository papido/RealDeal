import { auth, firestore } from "@/config/firebase";
import ingredientsJson from "@/src/constants/ingredients.json";
import { colors } from "@/src/constants/theme";
import {
  Ingredient,
  IngredientsByCategory,
  ParsedIngredient,
} from "@/src/constants/types";
import { VOLUME_UNITS, VolumeUnit } from "@/src/constants/volumeUnits";
import { useCart } from "@/src/contexts/CartProvider";
import { useIngredients } from "@/src/contexts/IngredientsProvider";
import {
  convertIngredient,
  findIngredientKeyByName,
} from "@/src/utils/ingredientConverter";
import { findCartMatches } from "@/src/utils/ingredientMatching";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

type SavedIngredient = {
  quantity?: string | null;
  unit?: string | null;
  ingredient?: string | null;
  resolvedQuantity?: number | null;
  resolvedUnit?: string | null;
  resolvedDensityEstimated?: boolean | null;
};

type SavedTile = {
  id: string;
  items: SavedIngredient[];
  recipeName?: string;
  createdAt?: any;
};

type PlannerSourceTile = {
  id: string;
  items: SavedIngredient[];
  recipeName?: string;
};

const ingredientsCatalog = ingredientsJson as IngredientsByCategory;
const findIngredientMetaByKey = (ingredientKey: string): Ingredient | null => {
  for (const category of Object.values(ingredientsCatalog)) {
    const item = category[ingredientKey];
    if (item) return item;
  }
  return null;
};
const getFallbackDensity = (name: string): number | null => {
  if (/\b(flour|flours)\b/i.test(name)) return 0.53;
  if (/\b(sugar|brown sugar|caster|granulated)\b/i.test(name)) return 0.85;
  if (
    /\b(spice|spices|powder|pepper|paprika|cumin|turmeric|cayenne)\b/i.test(
      name,
    )
  ) {
    return 0.5;
  }
  if (
    /\b(parsley|cilantro|basil|oregano|thyme|rosemary|dill|mint|herb|herbs)\b/i.test(
      name,
    )
  ) {
    return 0.25;
  }
  if (/\b(seasoning|seasonings)\b/i.test(name)) return 0.55;
  return null;
};
const getWeightToGrams = (unit: string): number | null => {
  const normalized = unit.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "g" || normalized === "gram" || normalized === "grams") {
    return 1;
  }
  if (
    normalized === "kg" ||
    normalized === "kilogram" ||
    normalized === "kilograms"
  ) {
    return 1000;
  }
  if (
    normalized === "lb" ||
    normalized === "lbs" ||
    normalized === "pound" ||
    normalized === "pounds"
  ) {
    return 453.592;
  }
  if (
    normalized === "oz" ||
    normalized === "ounce" ||
    normalized === "ounces"
  ) {
    return 28.3495;
  }
  return null;
};

const normalizeUnitKey = (unitRaw: string): string => {
  const normalized = unitRaw.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "g" || normalized === "gram" || normalized === "grams") {
    return "g";
  }
  if (
    normalized === "ml" ||
    normalized === "milliliter" ||
    normalized === "milliliters"
  ) {
    return "ml";
  }
  if (
    normalized === "piece" ||
    normalized === "pieces" ||
    normalized === "pc" ||
    normalized === "pcs"
  ) {
    return "piece";
  }
  return normalized;
};

const toBaseAmount = (
  value: number,
  unitRaw: string,
): { amount: number; unit: "g" | "ml" | "piece" } | null => {
  const normalized = unitRaw.toLowerCase().replace(/[^a-z.]/g, "");
  if (!normalized) return null;

  if (normalized === "g" || normalized === "gram" || normalized === "grams") {
    return { amount: value, unit: "g" };
  }
  if (
    normalized === "kg" ||
    normalized === "kilogram" ||
    normalized === "kilograms"
  ) {
    return { amount: value * 1000, unit: "g" };
  }
  if (
    normalized === "ml" ||
    normalized === "milliliter" ||
    normalized === "milliliters"
  ) {
    return { amount: value, unit: "ml" };
  }
  if (normalized === "l" || normalized === "liter" || normalized === "liters") {
    return { amount: value * 1000, unit: "ml" };
  }
  if (
    normalized === "piece" ||
    normalized === "pieces" ||
    normalized === "pc" ||
    normalized === "pcs"
  ) {
    return { amount: value, unit: "piece" };
  }

  const weightFactor = getWeightToGrams(unitRaw);
  if (weightFactor !== null) {
    return { amount: value * weightFactor, unit: "g" };
  }

  let volumeUnit: VolumeUnit | null = null;
  if (
    normalized === "tsp" ||
    normalized === "tsp." ||
    normalized === "teaspoon" ||
    normalized === "teaspoons"
  ) {
    volumeUnit = "tsp";
  } else if (
    normalized === "tbsp" ||
    normalized === "tbsp." ||
    normalized === "tablespoon" ||
    normalized === "tablespoons"
  ) {
    volumeUnit = "tbsp";
  } else if (
    normalized === "cup" ||
    normalized === "cups" ||
    normalized === "c" ||
    normalized === "c."
  ) {
    volumeUnit = "cup";
  } else if (
    normalized === "floz" ||
    normalized === "fl.oz" ||
    normalized === "fl.oz." ||
    normalized === "fluidounce" ||
    normalized === "fluidounces"
  ) {
    volumeUnit = "fl_oz";
  }

  if (volumeUnit) {
    return { amount: value * VOLUME_UNITS[volumeUnit], unit: "ml" };
  }

  return null;
};

const MenuScreen = () => {
  const {
    ingredients: ingredientsFromCart,
    selectedTileId: selectedTileIdParam,
  } = useLocalSearchParams<{
    ingredients?: string;
    selectedTileId?: string;
  }>();
  const [uid, setUid] = useState<string | null>(
    auth().currentUser?.uid ?? null,
  );
  const { cartItems } = useCart();
  const { ingredients } = useIngredients();
  const router = useRouter();
  const navigation = useNavigation();
  const [savedTiles, setSavedTiles] = useState<SavedTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusTick, setFocusTick] = useState(0);
  const cleanupOnceRef = useRef(false);
  const [aiConversions, setAiConversions] = useState<
    Record<
      string,
      {
        value: number;
        unit: string;
        display: string;
        densityEstimated?: boolean;
      }
    >
  >({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [showSelectedPrices, setShowSelectedPrices] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const [fixAllLoading, setFixAllLoading] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const [rewardedLoading, setRewardedLoading] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showAiHelpModal, setShowAiHelpModal] = useState(false);
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerSourceTile, setPlannerSourceTile] =
    useState<PlannerSourceTile | null>(null);
  const [plannerDateTime, setPlannerDateTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const pendingRewardShowRef = useRef(false);
  const rewardedAdRef = useRef<RewardedAd | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitleText}>Menu</Text>
          <Pressable
            onPress={() => setShowAiHelpModal(true)}
            hitSlop={8}
            style={styles.headerHintButton}
            accessibilityRole="button"
            accessibilityLabel="Show AI explanation"
          >
            <Ionicons name="help-circle-outline" size={22} color="#111827" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) {
      setSavedTiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const collectionRef = firestore()
      .collection("users")
      .doc(uid)
      .collection("parsedIngredients");

    const unsubscribe = collectionRef.orderBy("createdAt", "desc").onSnapshot(
      async (snapshot) => {
        const legacyDocs = snapshot.docs.filter((doc) => {
          const data = doc.data() as { items?: SavedIngredient[] };
          return !Array.isArray(data.items);
        });

        if (legacyDocs.length > 0 && !cleanupOnceRef.current) {
          cleanupOnceRef.current = true;
          try {
            const batch = firestore().batch();
            legacyDocs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
          } catch (error) {
            console.error("Error cleaning legacy ingredients:", error);
          }
        }

        const tiles = snapshot.docs
          .map((doc) => {
            const data = doc.data() as {
              items?: SavedIngredient[];
              recipeName?: string;
              createdAt?: any;
            };

            if (!Array.isArray(data.items)) return null;

            return {
              id: doc.id,
              items: data.items,
              recipeName: data.recipeName,
              createdAt: data.createdAt,
            };
          })
          .filter(Boolean) as SavedTile[];

        setSavedTiles(tiles);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading parsed ingredients:", error);
        setSavedTiles([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setAiCredits(0);
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          const data = doc.data() as { aiCredits?: number } | undefined;
          const value =
            typeof data?.aiCredits === "number" ? data.aiCredits : 0;
          setAiCredits(value);
        },
        () => setAiCredits(0),
      );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    // TODO: Replace with production rewarded ad unit id.
    const adUnitId = __DEV__ ? TestIds.REWARDED : "YOUR_REWARDED_AD_UNIT_ID";
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedAdRef.current = rewarded;

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setRewardedLoaded(true);
        setRewardedLoading(false);
        if (pendingRewardShowRef.current) {
          pendingRewardShowRef.current = false;
          rewarded.show();
        }
      },
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        if (!uid) return;
        try {
          await firestore().runTransaction(async (transaction) => {
            const userRef = firestore().collection("users").doc(uid);
            const userSnap = await transaction.get(userRef);
            const currentCredits =
              typeof userSnap.data()?.aiCredits === "number"
                ? userSnap.data()?.aiCredits
                : 0;
            transaction.update(userRef, { aiCredits: currentCredits + 5 });
          });
          Alert.alert("Credits added", "You received 5 AI credits.");
        } catch (error) {
          Alert.alert("Failed to add credits", "Please try again later.");
        }
      },
    );

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      rewardedAdRef.current = null;
    };
  }, [uid]);

  const filteredTiles = useMemo(() => savedTiles, [savedTiles]);

  const normalizeIngredient = useCallback((value: string): string => {
    const cleaned = value
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
  }, []);

  useEffect(() => {
    if (filteredTiles.length === 0) {
      setSelectedTileId(null);
      return;
    }

    const stillExists = filteredTiles.some(
      (tile) => tile.id === selectedTileId,
    );
    if (!stillExists) {
      setSelectedTileId(filteredTiles[0].id);
    }
  }, [filteredTiles, selectedTileId]);

  useEffect(() => {
    if (!selectedTileIdParam) return;
    const exists = filteredTiles.some((tile) => tile.id === selectedTileIdParam);
    if (exists) {
      setSelectedTileId(selectedTileIdParam);
    }
  }, [filteredTiles, selectedTileIdParam]);

  const selectedTile = useMemo(
    () => filteredTiles.find((tile) => tile.id === selectedTileId) ?? null,
    [filteredTiles, selectedTileId],
  );

  useFocusEffect(
    useCallback(() => {
      if (!selectedTileId && filteredTiles.length > 0) {
        setSelectedTileId(filteredTiles[0].id);
      }
      setFocusTick((prev) => prev + 1);
      setDropdownOpen(false);
    }, [filteredTiles, selectedTileId]),
  );

  const matchedIngredientSet = useMemo(() => {
    if (!selectedTile) return new Set<string>();
    const matches = findCartMatches(
      selectedTile.items as ParsedIngredient[],
      cartItems,
      ingredients.map((item) => item.name),
    );
    return new Set(
      matches
        .map((item) => normalizeIngredient(item.ingredient ?? ""))
        .filter(Boolean),
    );
  }, [selectedTile, cartItems, ingredients, focusTick, normalizeIngredient]);
  const ingredientStockMap = useMemo(() => {
    const map = new Map<
      string,
      { amount: number; unit: "g" | "ml" | "piece" }
    >();
    ingredients.forEach((item) => {
      const name = item.name ?? "";
      const normalizedName = normalizeIngredient(name);
      if (!normalizedName) return;

      const quantityValue = 1;
      const unitWeightValue = item.weight
        ? parseFloat(item.weight.toString().replace(/[^\d.]/g, ""))
        : NaN;
      if (Number.isNaN(quantityValue) || Number.isNaN(unitWeightValue)) return;

      const baseUnitWeight = toBaseAmount(unitWeightValue, item.unit ?? "");
      if (!baseUnitWeight) return;

      const totalAmount = quantityValue * baseUnitWeight.amount;
      const existing = map.get(normalizedName);
      if (existing && existing.unit === baseUnitWeight.unit) {
        map.set(normalizedName, {
          amount: existing.amount + totalAmount,
          unit: existing.unit,
        });
        return;
      }
      if (!existing) {
        map.set(normalizedName, {
          amount: totalAmount,
          unit: baseUnitWeight.unit,
        });
      }
    });
    return map;
  }, [ingredients, normalizeIngredient]);

  const ingredientMetaMap = useMemo(() => {
    const map = new Map<string, { unit?: string; unitPrice?: string }>();
    ingredients.forEach((item) => {
      const key = normalizeIngredient(item.name);
      if (key) {
        map.set(key, { unit: item.unit, unitPrice: item.unitPrice });
      }
    });
    return map;
  }, [ingredients, normalizeIngredient]);

  const isMatchedIngredient = useCallback(
    (normalizedName: string) => {
      if (!normalizedName) return false;
      if (matchedIngredientSet.has(normalizedName)) return true;

      for (const key of matchedIngredientSet) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          return true;
        }
      }

      return false;
    },
    [matchedIngredientSet],
  );

  const findIngredientMeta = useCallback(
    (normalizedName: string) => {
      if (!normalizedName) return null;
      const direct = ingredientMetaMap.get(normalizedName);
      if (direct) return direct;

      let bestMatch: { unit?: string; unitPrice?: string } | null = null;
      let bestScore = 0;
      let bestLength = 0;

      for (const [key, value] of ingredientMetaMap.entries()) {
        if (!key) continue;
        const includesMatch =
          normalizedName.includes(key) || key.includes(normalizedName);
        const bothSalt =
          normalizedName.includes("salt") && key.includes("salt");

        if (!includesMatch && !bothSalt) continue;

        const score = includesMatch ? 2 : 1;
        if (
          score > bestScore ||
          (score === bestScore && key.length > bestLength)
        ) {
          bestMatch = value;
          bestScore = score;
          bestLength = key.length;
        }
      }

      return bestMatch;
    },
    [ingredientMetaMap],
  );

  const toVolumeUnit = useCallback((unit: string): VolumeUnit | null => {
    const normalized = unit.toLowerCase().replace(/[^a-z.]/g, "");
    if (
      normalized === "tsp" ||
      normalized === "tsp." ||
      normalized === "teaspoon" ||
      normalized === "teaspoons"
    ) {
      return "tsp";
    }
    if (
      normalized === "tbsp" ||
      normalized === "tbsp." ||
      normalized === "tablespoon" ||
      normalized === "tablespoons"
    ) {
      return "tbsp";
    }
    if (
      normalized === "cup" ||
      normalized === "cups" ||
      normalized === "c" ||
      normalized === "c."
    ) {
      return "cup";
    }
    if (
      normalized === "floz" ||
      normalized === "fl.oz" ||
      normalized === "fl.oz." ||
      normalized === "fluidounce" ||
      normalized === "fluidounces"
    ) {
      return "fl_oz";
    }
    return null;
  }, []);

  const getEntriesToFix = useCallback(() => {
    if (!selectedTile) return [];
    return selectedTile.items
      .map((entry, entryIndex) => {
        const ingredientName =
          typeof entry.ingredient === "string" ? entry.ingredient : "";
        const normalizedName = normalizeIngredient(ingredientName);
        const isMatch = isMatchedIngredient(normalizedName);
        const meta = findIngredientMeta(normalizedName);
        const entryKey = `${selectedTile.id}-${entryIndex}`;
        const aiConversion = aiConversions[entryKey];
        const rawUnit = typeof entry.unit === "string" ? entry.unit : "";
        const entryUnit = rawUnit.toLowerCase().trim();
        const metaUnit = normalizeUnitKey(meta?.unit ?? "");
        const resolvedUnit = normalizeUnitKey(entry.resolvedUnit ?? "");
        const isToTaste = /\bto taste\b/i.test(entryUnit);
        const isSalt = normalizedName.includes("salt");
        const toTasteAmount = isToTaste && isSalt ? 0.5 : NaN;
        const autoPieceResolved = metaUnit === "piece";
        const unitMismatch =
          !!entryUnit && !!metaUnit && normalizeUnitKey(entryUnit) !== metaUnit;
        const quantityValue = entry.quantity
          ? parseFloat(entry.quantity.toString().replace(/[^\d.]/g, ""))
          : NaN;
        const conversion = (() => {
          if (!unitMismatch || !Number.isNaN(toTasteAmount)) {
            return null;
          }
          if (!entry.unit || Number.isNaN(quantityValue)) {
            return null;
          }
          const volumeUnit = toVolumeUnit(entry.unit);
          const weightFactor = getWeightToGrams(entry.unit);
          if (!volumeUnit && !weightFactor) return null;

          const ingredientKey = findIngredientKeyByName(ingredientName);
          if (ingredientKey) {
            const viaCatalog = convertIngredient(
              ingredientKey,
              quantityValue,
              volumeUnit,
            );
            if (viaCatalog) return viaCatalog;
          }

          if (meta?.unit && (meta.unit === "g" || meta.unit === "ml")) {
            if (meta.unit === "g" && weightFactor) {
              const gramsValue = quantityValue * weightFactor;
              return {
                value: gramsValue,
                unit: "g",
                display: `${gramsValue} g`,
              };
            }
            if (volumeUnit) {
              const mlAmount = quantityValue * VOLUME_UNITS[volumeUnit];
              const densityValue =
                typeof meta?.density === "number"
                  ? meta.density
                  : getFallbackDensity(ingredientName);
              if (meta.unit === "ml") {
                return {
                  value: mlAmount,
                  unit: "ml",
                  display: `${mlAmount} ml`,
                };
              }
              if (densityValue !== null) {
                const converted = mlAmount * densityValue;
                return {
                  value: converted,
                  unit: "g",
                  display: `${converted} g`,
                };
              }
            }
          }

          return null;
        })();
        const resolvedMismatch =
          !Number.isNaN(toTasteAmount) ||
          (!!conversion && !!meta?.unit && conversion.unit === meta.unit) ||
          (!!aiConversion &&
            !!metaUnit &&
            normalizeUnitKey(aiConversion.unit) === metaUnit) ||
          (!!resolvedUnit && !!metaUnit && resolvedUnit === metaUnit) ||
          autoPieceResolved;

        return {
          entry,
          entryIndex,
          entryKey,
          normalizedName,
          isMatch,
          unitMismatch,
          resolvedMismatch,
          metaUnit,
        };
      })
      .filter(
        (item) =>
          item.isMatch &&
          item.unitMismatch &&
          !item.resolvedMismatch &&
          !!item.metaUnit,
      );
  }, [
    selectedTile,
    normalizeIngredient,
    isMatchedIngredient,
    findIngredientMeta,
    aiConversions,
    toVolumeUnit,
  ]);

  const fixAllCount = useMemo(() => {
    const entries = getEntriesToFix().filter(
      (item) => item.unitMismatch && !item.resolvedMismatch,
    );
    const unique = new Set(
      entries.map((item) => item.normalizedName).filter(Boolean),
    );
    return unique.size;
  }, [getEntriesToFix]);

  useEffect(() => {
    if (!selectedTile) return;
    const entries = getEntriesToFix();
    const names = entries.map((item) => ({
      ingredient: item.entry.ingredient ?? "",
      entryUnit: item.entry.unit ?? "",
      metaUnit: item.metaUnit ?? "",
      resolvedUnit: item.entry.resolvedUnit ?? "",
    }));
  }, [selectedTile, getEntriesToFix]);

  const handleTogglePrices = useCallback(() => {
    setShowSelectedPrices((prev) => !prev);
  }, []);

  const handleWatchAd = useCallback(() => {
    const rewarded = rewardedAdRef.current;
    if (!rewarded) return;

    if (rewardedLoading) return;

    if (rewardedLoaded) {
      setRewardedLoaded(false);
      rewarded.show();
      // Preload the next ad after showing.
      setRewardedLoading(true);
      rewarded.load();
      return;
    }

    pendingRewardShowRef.current = true;
    setRewardedLoading(true);
    rewarded.load();
  }, [rewardedLoaded, rewardedLoading]);

  const getFixAllCost = useCallback((aiCount: number) => {
    if (aiCount <= 0) return 0;
    if (aiCount <= 10) return 3;
    if (aiCount <= 20) return 4;
    if (aiCount <= 40) return 6;
    return 7;
  }, []);

  const handleFixAll = useCallback(async () => {
    if (!uid || !selectedTile || fixAllLoading) return;

    const entriesToFix = getEntriesToFix();

    if (entriesToFix.length === 0) {
      Alert.alert("Nothing to fix", "No mismatched ingredients to resolve.");
      return;
    }

    const uniqueCount = new Set(
      entriesToFix.map((item) => item.normalizedName).filter(Boolean),
    ).size;
    const cost = getFixAllCost(uniqueCount);
    if (aiCredits < cost) {
      Alert.alert(
        "Not enough AI credits",
        `Found ${uniqueCount} mismatches. You need ${cost} credits to fix all, but you only have ${aiCredits}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Watch ad", onPress: handleWatchAd },
        ],
      );
      return;
    }

    setFixAllLoading(true);
    try {
      await firestore().runTransaction(async (transaction) => {
        const userRef = firestore().collection("users").doc(uid);
        const userSnap = await transaction.get(userRef);
        const currentCredits =
          typeof userSnap.data()?.aiCredits === "number"
            ? userSnap.data()?.aiCredits
            : 0;
        if (currentCredits < cost) {
          throw new Error("INSUFFICIENT_CREDITS");
        }
        transaction.update(userRef, { aiCredits: currentCredits - cost });
      });

      const aiCache = new Map<
        string,
        { amount: number; unit: string; densityEstimated?: boolean }
      >();
      let workingItems = selectedTile.items.map((item) => ({ ...item }));

      for (const item of entriesToFix) {
        const quantityValue = item.entry.quantity
          ? parseFloat(item.entry.quantity.toString().replace(/[^\d.]/g, ""))
          : NaN;
        const unitRaw = item.entry.unit ?? "";
        const cacheKey = `${item.normalizedName}|${unitRaw}|${item.metaUnit}|${
          Number.isNaN(quantityValue) ? "NaN" : quantityValue
        }`;

        const cached = aiCache.get(cacheKey);
        const result =
          cached ??
          (await handleResolveMismatch(
            item.entry,
            item.entryIndex,
            item.entryKey,
            item.metaUnit,
            true,
            undefined,
            false,
          ));

        if (result) {
          workingItems = workingItems.map((entryItem, index) =>
            index === item.entryIndex
              ? {
                  ...entryItem,
                  resolvedQuantity: result.amount,
                  resolvedUnit: result.unit,
                  resolvedDensityEstimated: result.densityEstimated,
                }
              : entryItem,
          );
          if (!cached && !Number.isNaN(quantityValue)) {
            aiCache.set(cacheKey, result);
          }
        }
      }

      await firestore()
        .collection("users")
        .doc(uid)
        .collection("parsedIngredients")
        .doc(selectedTileId)
        .set(
          {
            items: workingItems,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      setSavedTiles((prev) =>
        prev.map((tile) =>
          tile.id === selectedTileId ? { ...tile, items: workingItems } : tile,
        ),
      );
    } catch (error: any) {
      if (error?.message === "INSUFFICIENT_CREDITS") {
        Alert.alert(
          "Not enough AI credits",
          `You need ${cost} credits to fix all.`,
        );
      } else {
        Alert.alert("Fix all failed", "Please try again in a moment.");
      }
    } finally {
      setFixAllLoading(false);
    }
  }, [
    uid,
    selectedTile,
    fixAllLoading,
    getFixAllCost,
    aiCredits,
    getEntriesToFix,
    handleResolveMismatch,
    handleWatchAd,
  ]);

  const handleDeleteSelected = useCallback(() => {
    if (!uid || !selectedTileId) return;

    Alert.alert(
      "Delete saved ingredients",
      "This will remove the selected ingredients list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore()
                .collection("users")
                .doc(uid)
                .collection("parsedIngredients")
                .doc(selectedTileId)
                .delete();
              setSelectedTileId(null);
            } catch (error) {
              console.error("Error deleting saved ingredients:", error);
            }
          },
        },
      ],
    );
  }, [uid, selectedTileId]);

  const handleEditSelected = useCallback(() => {
    if (!selectedTile) return;
    router.push({
      pathname: "/(user)/menu/parseIng",
      params: {
        items: JSON.stringify(selectedTile.items),
        editAll: "1",
        tileId: selectedTile.id,
        recipeName: selectedTile.recipeName ?? "",
      },
    });
  }, [router, selectedTile]);

  const openPlannerModalForTile = useCallback((tile: PlannerSourceTile) => {
    setPlannerSourceTile(tile);
    setPlannerDateTime(new Date());
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowPlannerModal(true);
  }, []);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type !== "set" || !selectedDate) {
        setShowDatePicker(false);
        return;
      }
      setPlannerDateTime((prev) => {
        const next = new Date(prev);
        next.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );
        return next;
      });
      setShowDatePicker(false);
    },
    [],
  );

  const handleTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedTime?: Date) => {
      if (event.type !== "set" || !selectedTime) {
        setShowTimePicker(false);
        return;
      }
      setPlannerDateTime((prev) => {
        const next = new Date(prev);
        next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        return next;
      });
      setShowTimePicker(false);
    },
    [],
  );

  const handleSaveToPlanner = useCallback(async () => {
    if (!uid || !plannerSourceTile || plannerSaving) return;

    const recipeName =
      plannerSourceTile.recipeName?.trim() || "Saved Ingredients";

    try {
      setPlannerSaving(true);
      await firestore()
        .collection("users")
        .doc(uid)
        .collection("plannerEntries")
        .add({
          recipeId: plannerSourceTile.id,
          recipeName,
          items: plannerSourceTile.items,
          plannedFor: firestore.Timestamp.fromDate(plannerDateTime),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      setShowPlannerModal(false);
      setPlannerSourceTile(null);
      Alert.alert("Added to planner", `${recipeName} was scheduled.`);
    } catch (error) {
      console.error("Error saving planner entry:", error);
      Alert.alert("Failed to add planner entry", "Please try again.");
    } finally {
      setPlannerSaving(false);
    }
  }, [uid, plannerSourceTile, plannerSaving, plannerDateTime]);

  const handleResolveMismatch = useCallback(
    async (
      entry: SavedIngredient,
      entryIndex: number,
      entryKey: string,
      metaUnit?: string | null,
      forceAI: boolean = false,
      aiOverride?: { amount: number; unit: string; densityEstimated?: boolean },
      persist: boolean = true,
    ): Promise<
      { amount: number; unit: string; densityEstimated?: boolean } | null
    > => {
      if (!metaUnit) return;
      if (!uid || !selectedTileId) return;
      if (!entry.ingredient || !entry.unit) return;
      const metaUnitKey = normalizeUnitKey(metaUnit);
      const targetUnit = metaUnitKey || metaUnit.toLowerCase().trim();

      const quantityValue = entry.quantity
        ? parseFloat(entry.quantity.toString().replace(/[^\d.]/g, ""))
        : NaN;
      if (Number.isNaN(quantityValue)) {
        Alert.alert("Invalid quantity", "Please enter a numeric quantity.");
        return;
      }

      setAiLoading((prev) => ({ ...prev, [entryKey]: true }));
      try {
        if (!forceAI && metaUnitKey === "piece") {
          if (!persist) return null;
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      resolvedQuantity: 1,
                      resolvedUnit: "piece",
                    }
                  : item,
              )
            : (selectedTile?.items ?? []);

          await firestore()
            .collection("users")
            .doc(uid)
            .collection("parsedIngredients")
            .doc(selectedTileId)
            .set(
              {
                items: updatedItems,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId
                ? { ...tile, items: updatedItems }
                : tile,
            ),
          );
          return null;
        }

        const ingredientKey = findIngredientKeyByName(entry.ingredient);
        const meta = ingredientKey
          ? findIngredientMetaByKey(ingredientKey)
          : null;
        const normalizedUnit = entry.unit.toLowerCase().trim();
        const volumeUnit = toVolumeUnit(entry.unit);
        const weightFactor = getWeightToGrams(entry.unit);
        const directMassToG =
          normalizedUnit === "kg" ? quantityValue * 1000 : null;
        const directVolumeToMl =
          normalizedUnit === "l" ? quantityValue * 1000 : null;

        if (!forceAI && metaUnitKey === "g" && weightFactor !== null) {
          if (!persist) return null;
          const gramsValue = quantityValue * weightFactor;
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      resolvedQuantity: gramsValue,
                      resolvedUnit: "g",
                    }
                  : item,
              )
            : (selectedTile?.items ?? []);

          await firestore()
            .collection("users")
            .doc(uid)
            .collection("parsedIngredients")
            .doc(selectedTileId)
            .set(
              {
                items: updatedItems,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId
                ? { ...tile, items: updatedItems }
                : tile,
            ),
          );
          return null;
        }

        if (!forceAI && metaUnitKey === "ml" && directVolumeToMl !== null) {
          if (!persist) return null;
          const rounded = directVolumeToMl;
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      resolvedQuantity: rounded,
                      resolvedUnit: "ml",
                    }
                  : item,
              )
            : (selectedTile?.items ?? []);

          await firestore()
            .collection("users")
            .doc(uid)
            .collection("parsedIngredients")
            .doc(selectedTileId)
            .set(
              {
                items: updatedItems,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId
                ? { ...tile, items: updatedItems }
                : tile,
            ),
          );
          return;
        }

        if (
          !forceAI &&
          volumeUnit &&
          (metaUnitKey === "g" || metaUnitKey === "ml")
        ) {
          const mlAmount = quantityValue * VOLUME_UNITS[volumeUnit];
          const densityValue =
            typeof meta?.density === "number"
              ? meta.density
              : getFallbackDensity(entry.ingredient ?? "");
          if (metaUnitKey === "g" && densityValue === null) {
            // No density available for mass conversion; let AI handle it.
          } else {
            if (!persist) return null;
            const converted =
              metaUnitKey === "ml" ? mlAmount : mlAmount * densityValue;
            const rounded = converted;
            const updatedItems = selectedTileId
              ? (selectedTile?.items ?? []).map((item, index) =>
                  index === entryIndex
                    ? {
                        ...item,
                        resolvedQuantity: rounded,
                        resolvedUnit: metaUnitKey,
                      }
                    : item,
                )
              : (selectedTile?.items ?? []);

            await firestore()
              .collection("users")
              .doc(uid)
              .collection("parsedIngredients")
              .doc(selectedTileId)
              .set(
                {
                  items: updatedItems,
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
              );

            setSavedTiles((prev) =>
              prev.map((tile) =>
                tile.id === selectedTileId
                  ? { ...tile, items: updatedItems }
                  : tile,
              ),
            );
            return null;
          }
        }

        let amount: number | undefined;
        let unit: string | undefined;
        let densityEstimated = false;

        if (aiOverride) {
          amount = aiOverride.amount;
          unit = aiOverride.unit;
          densityEstimated = !!aiOverride.densityEstimated;
        } else {
          const response = await fetch(
            "https://us-central1-realdeal-f46e1.cloudfunctions.net/convertIngredientUnit",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ingredientName: entry.ingredient,
                quantity: quantityValue,
                unit: entry.unit,
                targetUnit,
                density: meta?.density,
                state: meta?.state,
              }),
            },
          );

          if (!response.ok) {
            let errorDetails = "";
            try {
              const errorPayload = await response.json();
              errorDetails = errorPayload?.details
                ? ` ${JSON.stringify(errorPayload.details)}`
                : errorPayload?.error
                  ? ` ${errorPayload.error}`
                  : "";
            } catch (parseError) {
              errorDetails = "";
            }
            throw new Error(
              `Conversion failed (${response.status}).${errorDetails}`,
            );
          }

          const payload = await response.json();
          const result = payload?.result;
          amount = result?.amount;
          unit = result?.unit;
          densityEstimated = !!result?.densityEstimated;
        }

        if (typeof amount !== "number" || !unit) {
          Alert.alert("No conversion", "Could not convert this ingredient.");
          return;
        }

        if (normalizeUnitKey(unit) !== metaUnitKey) {
          Alert.alert(
            "Unit mismatch",
            `Expected ${targetUnit}, but got ${unit}.`,
          );
          return null;
        }

        const normalizedAmount = amount;
        if (!persist) {
          return { amount: normalizedAmount, unit, densityEstimated };
        }
        const updatedItems = selectedTileId
          ? (selectedTile?.items ?? []).map((item, index) =>
              index === entryIndex
                ? {
                    ...item,
                    resolvedQuantity: normalizedAmount,
                    resolvedUnit: unit,
                    resolvedDensityEstimated: densityEstimated,
                  }
                : item,
            )
          : (selectedTile?.items ?? []);

        await firestore()
          .collection("users")
          .doc(uid)
          .collection("parsedIngredients")
          .doc(selectedTileId)
          .set(
            {
              items: updatedItems,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        console.log("AI saved:", {
          ingredient: entry.ingredient,
          resolvedQuantity: normalizedAmount,
          resolvedUnit: unit,
          tileId: selectedTileId,
        });

        setSavedTiles((prev) =>
          prev.map((tile) =>
            tile.id === selectedTileId
              ? { ...tile, items: updatedItems }
              : tile,
          ),
        );
        setAiConversions((prev) => {
          const next = { ...prev };
          delete next[entryKey];
          return next;
        });
        return { amount, unit, densityEstimated };
      } catch (error) {
        console.error("AI conversion error:", error);
        Alert.alert("Conversion failed", "Please try again.");
        return null;
      } finally {
        setAiLoading((prev) => ({ ...prev, [entryKey]: false }));
      }
    },
    [uid, selectedTileId, selectedTile],
  );

  return (
    <LinearGradient
      colors={["#0b1f16", "#0f2a1c", "#122f21"]}
      style={styles.container}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : !uid ? (
        <Text style={styles.emptyText}>
          Please sign in to view saved ingredients.
        </Text>
      ) : savedTiles.length === 0 ? (
        <Text style={styles.emptyText}>No saved ingredients yet.</Text>
      ) : filteredTiles.length === 0 ? (
        <Text style={styles.emptyText}>No matching ingredients.</Text>
      ) : (
        <>
          <View style={styles.dropdownSection}>
            <TouchableOpacity
              onPress={() => setDropdownOpen((prev) => !prev)}
              style={styles.dropdownButtonPressable}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#fef3c7", "#fde68a"]}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedTile
                    ? `${selectedTile.recipeName?.trim() || "Selected Ingredients"} (${selectedTile.items.length})`
                    : "Select saved ingredients"}
                </Text>
                <Ionicons
                  name={dropdownOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#334155"
                />
              </LinearGradient>
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownOverlay}>
                <LinearGradient
                  colors={["#fef3c7", "#fde68a"]}
                  style={styles.dropdownList}
                >
                  {filteredTiles.map((tile, index) => (
                    <TouchableOpacity
                      key={tile.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTileId(tile.id);
                        setDropdownOpen(false);
                      }}
                      onLongPress={() => {
                        setDropdownOpen(false);
                        openPlannerModalForTile(tile);
                      }}
                      delayLongPress={300}
                    >
                      <Text style={styles.dropdownItemText}>
                        {tile.recipeName?.trim() || `Saved Ingredients #${index + 1}`} ({tile.items.length})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </LinearGradient>
              </View>
            )}
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.selectionSection}>
              {selectedTile && (
                <View style={styles.selectedTileWrap}>
                  <LinearGradient
                    colors={["#fef3c7", "#fde68a"]}
                    style={styles.selectedTile}
                  >
                    <View style={styles.tileHeader}>
                    <TouchableOpacity
                      onLongPress={() => openPlannerModalForTile(selectedTile)}
                      delayLongPress={300}
                      style={styles.recipeNamePressable}
                    >
                      <Text style={styles.tileTitle}>
                        {selectedTile.recipeName?.trim() || "Selected Ingredients"} ({selectedTile.items.length})
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.tileActions}>
                      <TouchableOpacity
                        onPress={handleFixAll}
                        style={styles.fixAllButton}
                        accessibilityLabel="Fix all ingredients"
                        accessibilityRole="button"
                        disabled={fixAllLoading}
                      >
                        <Text style={styles.fixAllText}>
                          {fixAllLoading
                            ? "Fixing..."
                            : `Fix all (${fixAllCount})`}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleTogglePrices}
                        style={styles.iconButton}
                        accessibilityLabel={
                          showSelectedPrices
                            ? "Hide selected ingredient prices"
                            : "Show selected ingredient prices"
                        }
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name={
                            showSelectedPrices
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={18}
                          color="#334155"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleEditSelected}
                        style={styles.editButton}
                        accessibilityLabel="Edit saved ingredients"
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color="#334155"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleDeleteSelected}
                        style={styles.deleteButton}
                        accessibilityLabel="Delete saved ingredients"
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#b91c1c"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                    <View style={styles.legendRow}>
                      <Text style={[styles.legendPill, styles.legendGreen]}>
                        Green = in cart
                      </Text>
                    <Text style={[styles.legendPill, styles.legendGray]}>
                      Black = not in cart
                    </Text>
                      <Text style={[styles.legendPill, styles.legendYellow]}>
                        Yellow = unit mismatch
                      </Text>
                      <Text style={[styles.legendPill, styles.legendRed]}>
                        Red = not enough
                      </Text>
                    </View>
                    <View style={styles.tileList}>
                      {(() => {
                      let totalSum = 0;
                      const computedEntries = selectedTile.items.map(
                        (entry, entryIndex) => {
                          const ingredientName =
                            typeof entry.ingredient === "string"
                              ? entry.ingredient
                              : "";
                          const normalizedName =
                            normalizeIngredient(ingredientName);
                          const isMatch = isMatchedIngredient(normalizedName);
                          const meta = findIngredientMeta(normalizedName);
                          const entryKey = `${selectedTile.id}-${entryIndex}`;
                          const aiConversion = aiConversions[entryKey];
                          const rawUnit =
                            typeof entry.unit === "string" ? entry.unit : "";
                          const entryUnit = rawUnit.toLowerCase().trim();
                          const metaUnit = normalizeUnitKey(meta?.unit ?? "");
                          const resolvedUnit = normalizeUnitKey(
                            entry.resolvedUnit ?? "",
                          );
                          const resolvedQuantityValue =
                            typeof entry.resolvedQuantity === "number"
                              ? entry.resolvedQuantity
                              : NaN;
                          const densityEstimated =
                            !!entry.resolvedDensityEstimated;
                          const autoPieceResolved = metaUnit === "piece";
                          const unitMismatch =
                            !!entryUnit &&
                            !!metaUnit &&
                            normalizeUnitKey(entryUnit) !== metaUnit;
                          const isToTaste = /\bto taste\b/i.test(entryUnit);
                          const isSalt = normalizedName.includes("salt");
                          const toTasteAmount = isToTaste && isSalt ? 0.5 : NaN;
                          const unitPriceRaw =
                            meta?.unitPrice?.toString() ?? "";
                          const unitPriceDisplay = unitPriceRaw
                            .replace(/rm\s*/i, "")
                            .trim();
                          const unitPriceValue = unitPriceRaw
                            ? parseFloat(unitPriceRaw.replace(/[^\d.]/g, ""))
                            : NaN;
                          const quantityValue = entry.quantity
                            ? parseFloat(
                                entry.quantity
                                  .toString()
                                  .replace(/[^\d.]/g, ""),
                              )
                            : NaN;
                          const booleanQuantity =
                            entry.quantity === true ? 1 : NaN;
                          const resolvedQuantityForDisplay = !Number.isNaN(
                            quantityValue,
                          )
                            ? quantityValue
                            : !Number.isNaN(booleanQuantity)
                              ? booleanQuantity
                              : NaN;
                          const displayQuantity = !Number.isNaN(
                            resolvedQuantityForDisplay,
                          )
                            ? resolvedQuantityForDisplay
                            : "?";
                          const conversion = (() => {
                            if (!unitMismatch || !Number.isNaN(toTasteAmount)) {
                              return null;
                            }
                            if (!entry.unit || Number.isNaN(quantityValue)) {
                              return null;
                            }
                            const volumeUnit = toVolumeUnit(entry.unit);
                            const weightFactor = getWeightToGrams(entry.unit);
                            if (!volumeUnit && !weightFactor) return null;

                            const ingredientKey =
                              findIngredientKeyByName(ingredientName);
                            if (ingredientKey) {
                              const viaCatalog = convertIngredient(
                                ingredientKey,
                                quantityValue,
                                volumeUnit,
                              );
                              if (viaCatalog) return viaCatalog;
                            }

                            if (
                              meta?.unit &&
                              (meta.unit === "g" || meta.unit === "ml")
                            ) {
                              if (meta.unit === "g" && weightFactor) {
                                const gramsValue = quantityValue * weightFactor;
                                return {
                                  value: gramsValue,
                                  unit: "g",
                                  display: `${gramsValue} g`,
                                };
                              }
                              if (volumeUnit) {
                                const mlAmount =
                                  quantityValue * VOLUME_UNITS[volumeUnit];
                                const densityValue =
                                  typeof meta?.density === "number"
                                    ? meta.density
                                    : getFallbackDensity(ingredientName);
                                if (meta.unit === "ml") {
                                  return {
                                    value: mlAmount,
                                    unit: "ml",
                                    display: `${mlAmount} ml`,
                                  };
                                }
                                if (densityValue !== null) {
                                  const converted = mlAmount * densityValue;
                                  return {
                                    value: converted,
                                    unit: "g",
                                    display: `${converted} g`,
                                  };
                                }
                              }
                            }

                            return null;
                          })();
                          const resolvedMismatch =
                            !Number.isNaN(toTasteAmount) ||
                            (!!conversion &&
                              !!meta?.unit &&
                              conversion.unit === meta.unit) ||
                            (!!aiConversion &&
                              !!meta?.unit &&
                              normalizeUnitKey(aiConversion.unit) ===
                                normalizeUnitKey(meta.unit)) ||
                            (!!resolvedUnit &&
                              !!metaUnit &&
                              resolvedUnit === metaUnit) ||
                            autoPieceResolved;
                          if (
                            isMatch &&
                            unitMismatch &&
                            !resolvedMismatch &&
                            resolvedUnit
                          ) {
                            console.log("Unresolved after AI save:", {
                              ingredient: ingredientName,
                              entryUnit,
                              metaUnit,
                              resolvedUnit,
                              resolvedQuantityValue,
                            });
                          }
                          const effectiveAmount = resolvedMismatch
                            ? !Number.isNaN(toTasteAmount)
                              ? toTasteAmount
                              : autoPieceResolved
                                ? !Number.isNaN(quantityValue)
                                  ? quantityValue
                                  : 1
                                : !Number.isNaN(resolvedQuantityValue) &&
                                    resolvedUnit === metaUnit
                                  ? resolvedQuantityValue
                                  : (aiConversion?.value ?? conversion?.value)
                            : !Number.isNaN(quantityValue)
                              ? quantityValue
                              : !Number.isNaN(booleanQuantity)
                                ? booleanQuantity
                                : NaN;
                          const totalPrice =
                            !Number.isNaN(unitPriceValue) &&
                            !Number.isNaN(effectiveAmount)
                              ? unitPriceValue * effectiveAmount
                              : NaN;
                          if (!Number.isNaN(totalPrice)) {
                            totalSum += totalPrice;
                          }
                          const priceUnit = !Number.isNaN(toTasteAmount)
                            ? "g"
                            : autoPieceResolved
                              ? "piece"
                              : resolvedUnit && resolvedUnit === metaUnit
                                ? resolvedUnit
                                : (aiConversion?.unit ??
                                  conversion?.unit ??
                                  meta?.unit ??
                                  "");
                          const unitPriceLabel =
                            isMatch && meta && !Number.isNaN(unitPriceValue)
                              ? [unitPriceDisplay, priceUnit]
                                  .filter(Boolean)
                                  .join(" / ")
                              : "";
                          const totalLabel = isMatch
                            ? !Number.isNaN(totalPrice)
                              ? `RM ${totalPrice.toFixed(2)}`
                              : ""
                            : "";
                          const conversionLabel = !Number.isNaN(toTasteAmount)
                            ? `${toTasteAmount} g`
                            : autoPieceResolved
                              ? `${!Number.isNaN(quantityValue) ? quantityValue : 1} piece`
                              : resolvedUnit &&
                                  resolvedUnit === metaUnit &&
                                  !Number.isNaN(resolvedQuantityValue)
                                ? `${resolvedQuantityValue} ${resolvedUnit}`
                                : aiConversion
                                  ? aiConversion.display
                                  : conversion
                                    ? `${conversion.display}`
                                    : "";
                          const showResolveButton =
                            isMatch && unitMismatch && !resolvedMismatch;
                          const densityFlag = densityEstimated
                            ? "AI density"
                            : "";
                          const metaText = [
                            showSelectedPrices ? unitPriceLabel : "",
                            showSelectedPrices ? conversionLabel : "",
                            showSelectedPrices ? densityFlag : "",
                            showSelectedPrices ? totalLabel : "",
                          ]
                            .filter((value) => {
                              if (!value) return false;
                              const text = value
                                .toString()
                                .trim()
                                .toLowerCase();
                              return text !== "true" && text !== "false";
                            })
                            .join(" • ");

                          return {
                            entry,
                            entryIndex,
                            ingredientName,
                            normalizedName,
                            isMatch,
                            meta,
                            entryKey,
                            rawUnit,
                            entryUnit,
                            metaUnit,
                            resolvedUnit,
                            resolvedMismatch,
                            effectiveAmount,
                            priceUnit,
                            unitMismatch,
                            displayQuantity,
                            showResolveButton,
                            metaText,
                          };
                        },
                      );

                      const hasUnresolvedMismatch = computedEntries.some(
                        (item) =>
                          item.isMatch &&
                          item.unitMismatch &&
                          !item.resolvedMismatch,
                      );
                      const enableQuantityCheck = !hasUnresolvedMismatch;

                      const rows = computedEntries.map((item) => {
                        const requiredBase =
                          enableQuantityCheck &&
                          item.isMatch &&
                          !Number.isNaN(item.effectiveAmount) &&
                          item.priceUnit
                            ? toBaseAmount(item.effectiveAmount, item.priceUnit)
                            : null;
                        const stock =
                          enableQuantityCheck && item.isMatch
                            ? ingredientStockMap.get(item.normalizedName)
                            : null;
                        const isLowInCart =
                          enableQuantityCheck &&
                          item.isMatch &&
                          requiredBase &&
                          stock &&
                          stock.unit === requiredBase.unit &&
                          stock.amount < requiredBase.amount;

                        return (
                          <View
                            key={`${selectedTile.id}-${item.entryIndex}`}
                            style={styles.tileItemRow}
                          >
                            <Text
                              style={[
                                styles.tileItem,
                                styles.tileItemLabel,
                                item.isMatch && styles.tileItemMatch,
                                item.isMatch &&
                                  item.unitMismatch &&
                                  !item.resolvedMismatch &&
                                  styles.tileItemWarn,
                                isLowInCart && styles.tileItemLow,
                              ]}
                            >
                              {"- "}
                              {item.displayQuantity}{" "}
                              {item.rawUnit ? `${item.rawUnit} ` : ""}
                              {item.ingredientName || "Unnamed"}
                            </Text>
                            {showSelectedPrices &&
                            item.isMatch &&
                            item.metaText ? (
                              <Text
                                style={[
                                  styles.tileItemMeta,
                                  item.isMatch && styles.tileItemMatch,
                                  item.isMatch &&
                                    item.unitMismatch &&
                                    !item.resolvedMismatch &&
                                    styles.tileItemWarn,
                                  isLowInCart && styles.tileItemLow,
                                ]}
                              >
                                {item.metaText}
                              </Text>
                            ) : null}
                            {showSelectedPrices && item.showResolveButton ? (
                              <TouchableOpacity
                                style={[
                                  styles.resolveButton,
                                  aiLoading[item.entryKey] &&
                                    styles.resolveButtonDisabled,
                                ]}
                                onPress={() =>
                                  handleResolveMismatch(
                                    item.entry,
                                    item.entryIndex,
                                    item.entryKey,
                                    item.meta?.unit ?? null,
                                  )
                                }
                                disabled={aiLoading[item.entryKey]}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={18}
                                  color="#b91c1c"
                                />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        );
                      });

                      return (
                        <>
                          {rows}
                          {showSelectedPrices ? (
                            <View style={styles.totalRow}>
                              <Text style={styles.totalLabel}>Total</Text>
                              <Text style={styles.totalValue}>
                                {totalSum > 0
                                  ? `RM ${totalSum.toFixed(2)}`
                                  : "RM -"}
                              </Text>
                            </View>
                          ) : null}
                        </>
                      );
                      })()}
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
      <Modal
        visible={showAiHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAiHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How AI helps</Text>
            <Text style={styles.modalSubtitle}>
              AI estimates unit conversions and ingredient matching so you can
              compare your saved ingredients against what’s in your cart.
            </Text>
            <Text style={styles.modalBody}>
              When units don’t match (e.g., tbsp vs g), AI suggests a best-fit
              conversion based on ingredient density. You can accept or edit
              results before saving.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowAiHelpModal(false)}
                style={[styles.modalButton, styles.modalSaveButton]}
              >
                <Text style={styles.modalSaveText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPlannerModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!plannerSaving) {
            setShowPlannerModal(false);
            setPlannerSourceTile(null);
            setShowDatePicker(false);
            setShowTimePicker(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to planner</Text>
            <Text style={styles.modalSubtitle}>
              {plannerSourceTile?.recipeName?.trim() || "Saved Ingredients"}
            </Text>
            <View style={styles.datetimeRow}>
              <Pressable
                style={styles.datetimeButton}
                onPress={() => {
                  setShowTimePicker(false);
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={16} color="#fef9c7" />
                <Text style={styles.datetimeButtonText}>
                  {plannerDateTime.toLocaleDateString()}
                </Text>
              </Pressable>
              <Pressable
                style={styles.datetimeButton}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(true);
                }}
              >
                <Ionicons name="time-outline" size={16} color="#fef9c7" />
                <Text style={styles.datetimeButtonText}>
                  {plannerDateTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
            </View>
            {showDatePicker ? (
              <DateTimePicker
                value={plannerDateTime}
                mode="date"
                onChange={handleDateChange}
              />
            ) : null}
            {showTimePicker ? (
              <DateTimePicker
                value={plannerDateTime}
                mode="time"
                onChange={handleTimeChange}
              />
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowPlannerModal(false);
                  setPlannerSourceTile(null);
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
                style={[styles.modalButton, styles.modalCancelButton]}
                disabled={plannerSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveToPlanner}
                style={[styles.modalButton, styles.modalSaveButton]}
                disabled={plannerSaving || !plannerSourceTile}
              >
                <Text style={styles.modalSaveText}>
                  {plannerSaving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  infoText: {
    paddingHorizontal: 16,
    paddingTop: 10,
    color: "#e2e8f0",
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#e2e8f0",
  },
  selectionSection: {
    paddingHorizontal: 16,
  },
  dropdownSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 2,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: 14,
  },
  dropdownButtonPressable: {
    borderRadius: 12,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#cbd5f5",
  },
  dropdownButtonText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#0f172a",
  },
  selectedTile: {
    marginTop: 0,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tile: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  legendPill: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  legendGreen: {
    backgroundColor: "#bbf7d0",
    color: "#065f46",
  },
  legendYellow: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  legendGray: {
    backgroundColor: "#e5e7eb",
    color: "#000",
  },
  legendRed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  tileList: {
    gap: 6,
  },
  tileItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tileItem: {
    fontSize: 14,
    color: "#000",
    fontWeight: "700",
  },
  tileItemLabel: {
    flex: 1,
    paddingRight: 6,
  },
  tileItemMeta: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
  },
  tileItemDim: {
    color: "#6b7280",
  },
  tileItemMatch: {
    color: "#0b7a2a",
    fontWeight: "700",
  },
  tileItemWarn: {
    color: "#ca8a04",
  },
  tileItemLow: {
    color: "#b91c1c",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  togglePricesButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  togglePricesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  fixAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#0b7a2a",
    marginRight: 4,
  },
  fixAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  resolveButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resolveButtonDisabled: {
    opacity: 0.6,
  },
  recipeNamePressable: {
    flex: 1,
    paddingRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#cbd5f5",
    fontWeight: "600",
  },
  modalBody: {
    marginTop: 10,
    fontSize: 13,
    color: "#e2e8f0",
  },
  datetimeRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  datetimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  datetimeButtonText: {
    fontSize: 13,
    color: "#fef9c7",
    fontWeight: "600",
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelButton: {
    marginRight: 10,
    backgroundColor: "#1f2937",
  },
  modalSaveButton: {
    backgroundColor: "#1a73e8",
  },
  modalCancelText: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "600",
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  headerHintButton: {
    marginLeft: 6,
    paddingVertical: 2,
  },
  selectedTileWrap: {
    marginTop: 16,
  },
});
