import { auth, firestore } from "@/config/firebase";
import { colors } from "@/src/constants/theme";
import ingredientsJson from "@/src/constants/ingredients.json";
import { Ingredient, IngredientsByCategory, ParsedIngredient } from "@/src/constants/types";
import { VOLUME_UNITS, VolumeUnit } from "@/src/constants/volumeUnits";
import { useCart } from "@/src/contexts/CartProvider";
import { useIngredients } from "@/src/contexts/IngredientsProvider";
import {
  convertIngredient,
  findIngredientKeyByName,
} from "@/src/utils/ingredientConverter";
import { findCartMatches } from "@/src/utils/ingredientMatching";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  createdAt?: any;
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
    /\b(spice|spices|powder|pepper|paprika|cumin|turmeric|cayenne)\b/i.test(name)
  ) {
    return 0.5;
  }
  return null;
};
const getWeightToGrams = (unit: string): number | null => {
  const normalized = unit.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "g" || normalized === "gram" || normalized === "grams") {
    return 1;
  }
  if (normalized === "kg" || normalized === "kilogram" || normalized === "kilograms") {
    return 1000;
  }
  if (normalized === "lb" || normalized === "lbs" || normalized === "pound" || normalized === "pounds") {
    return 453.592;
  }
  if (normalized === "oz" || normalized === "ounce" || normalized === "ounces") {
    return 28.3495;
  }
  return null;
};

const MenuScreen = () => {
  const { ingredients: ingredientsFromCart } = useLocalSearchParams<{
    ingredients?: string;
  }>();
  const [uid, setUid] = useState<string | null>(
    auth().currentUser?.uid ?? null
  );
  const { cartItems } = useCart();
  const { ingredients } = useIngredients();
  const router = useRouter();
  const [savedTiles, setSavedTiles] = useState<SavedTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusTick, setFocusTick] = useState(0);
  const cleanupOnceRef = useRef(false);
  const [aiConversions, setAiConversions] = useState<
    Record<
      string,
      { value: number; unit: string; display: string; densityEstimated?: boolean }
    >
  >({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

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
              createdAt?: any;
            };

            if (!Array.isArray(data.items)) return null;

            return {
              id: doc.id,
              items: data.items,
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
      }
    );

    return () => unsubscribe();
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
      (tile) => tile.id === selectedTileId
    );
    if (!stillExists) {
      setSelectedTileId(filteredTiles[0].id);
    }
  }, [filteredTiles, selectedTileId]);

  const selectedTile = useMemo(
    () => filteredTiles.find((tile) => tile.id === selectedTileId) ?? null,
    [filteredTiles, selectedTileId]
  );

  useFocusEffect(
    useCallback(() => {
      if (!selectedTileId && filteredTiles.length > 0) {
        setSelectedTileId(filteredTiles[0].id);
      }
      setFocusTick((prev) => prev + 1);
      setDropdownOpen(false);
    }, [filteredTiles, selectedTileId])
  );

  const matchedIngredientSet = useMemo(() => {
    if (!selectedTile) return new Set<string>();
    const matches = findCartMatches(
      selectedTile.items as ParsedIngredient[],
      cartItems,
      ingredients.map((item) => item.name)
    );
    return new Set(
      matches
        .map((item) => normalizeIngredient(item.ingredient ?? ""))
        .filter(Boolean)
    );
  }, [selectedTile, cartItems, ingredients, focusTick, normalizeIngredient]);

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
        if (
          normalizedName.includes(key) ||
          key.includes(normalizedName)
        ) {
          return true;
        }
      }

      return false;
    },
    [matchedIngredientSet]
  );

  const findIngredientMeta = useCallback(
    (normalizedName: string) => {
      if (!normalizedName) return null;
      const direct = ingredientMetaMap.get(normalizedName);
      if (direct) return direct;

      let bestMatch: { unit?: string; unitPrice?: string } | null = null;
      let bestLength = 0;

      for (const [key, value] of ingredientMetaMap.entries()) {
        if (!key) continue;
        if (
          normalizedName.includes(key) ||
          key.includes(normalizedName)
        ) {
          if (key.length > bestLength) {
            bestMatch = value;
            bestLength = key.length;
          }
        }
      }

      return bestMatch;
    },
    [ingredientMetaMap]
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
    if (normalized === "cup" || normalized === "cups" || normalized === "c" || normalized === "c.") {
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
      ]
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
      },
    });
  }, [router, selectedTile]);

  const handleResolveMismatch = useCallback(
    async (
      entry: SavedIngredient,
      entryIndex: number,
      entryKey: string,
      metaUnit?: string | null
    ) => {
      if (!metaUnit) return;
      if (!uid || !selectedTileId) return;
      if (!entry.ingredient || !entry.unit) return;

      const quantityValue = entry.quantity
        ? parseFloat(entry.quantity.toString().replace(/[^\d.]/g, ""))
        : NaN;
      if (Number.isNaN(quantityValue)) {
        Alert.alert("Invalid quantity", "Please enter a numeric quantity.");
        return;
      }

      setAiLoading((prev) => ({ ...prev, [entryKey]: true }));
      try {
        if (metaUnit.toLowerCase() === "piece") {
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      resolvedQuantity: 1,
                      resolvedUnit: "piece",
                    }
                  : item
              )
            : selectedTile?.items ?? [];

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
              { merge: true }
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId ? { ...tile, items: updatedItems } : tile
            )
          );
          return;
        }

        const ingredientKey = findIngredientKeyByName(entry.ingredient);
        const meta = ingredientKey ? findIngredientMetaByKey(ingredientKey) : null;
        const normalizedUnit = entry.unit.toLowerCase().trim();
        const volumeUnit = toVolumeUnit(entry.unit);
        const weightFactor = getWeightToGrams(entry.unit);
        const directMassToG =
          normalizedUnit === "kg" ? quantityValue * 1000 : null;
        const directVolumeToMl =
          normalizedUnit === "l" ? quantityValue * 1000 : null;

        if (metaUnit.toLowerCase() === "g" && weightFactor !== null) {
          const gramsValue = quantityValue * weightFactor;
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      quantity: gramsValue,
                      unit: "g",
                    }
                  : item
              )
            : selectedTile?.items ?? [];

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
              { merge: true }
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId ? { ...tile, items: updatedItems } : tile
            )
          );
          return;
        }

        if (metaUnit.toLowerCase() === "ml" && directVolumeToMl !== null) {
          const rounded = directVolumeToMl;
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      quantity: rounded,
                      unit: "ml",
                    }
                  : item
              )
            : selectedTile?.items ?? [];

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
              { merge: true }
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId ? { ...tile, items: updatedItems } : tile
            )
          );
          return;
        }

        if (volumeUnit && (metaUnit.toLowerCase() === "g" || metaUnit.toLowerCase() === "ml")) {
          const mlAmount = quantityValue * VOLUME_UNITS[volumeUnit];
          const densityValue =
            typeof meta?.density === "number"
              ? meta.density
              : getFallbackDensity(entry.ingredient ?? "");
          if (metaUnit.toLowerCase() === "g" && densityValue === null) {
            // No density available for mass conversion; let AI handle it.
          } else {
          const converted =
            metaUnit.toLowerCase() === "ml" ? mlAmount : mlAmount * densityValue;
          const rounded = converted;
          const updatedItems = selectedTileId
            ? (selectedTile?.items ?? []).map((item, index) =>
                index === entryIndex
                  ? {
                      ...item,
                      quantity: rounded,
                      unit: metaUnit.toLowerCase(),
                    }
                  : item
              )
            : selectedTile?.items ?? [];

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
              { merge: true }
            );

          setSavedTiles((prev) =>
            prev.map((tile) =>
              tile.id === selectedTileId ? { ...tile, items: updatedItems } : tile
            )
          );
          return;
          }
        }

        const response = await fetch(
          "https://us-central1-realdeal-f46e1.cloudfunctions.net/convertIngredientUnit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ingredientName: entry.ingredient,
              quantity: quantityValue,
              unit: entry.unit,
              targetUnit: metaUnit,
              density: meta?.density,
              state: meta?.state,
            }),
          }
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
          throw new Error(`Conversion failed (${response.status}).${errorDetails}`);
        }

        const payload = await response.json();
        const result = payload?.result;
        const amount = result?.amount;
        const unit = result?.unit;
        const densityEstimated = !!result?.densityEstimated;

        if (typeof amount !== "number" || !unit) {
          Alert.alert("No conversion", "Could not convert this ingredient.");
          return;
        }

        if (unit.toLowerCase() !== metaUnit.toLowerCase()) {
          Alert.alert(
            "Unit mismatch",
            `Expected ${metaUnit}, but got ${unit}.`
          );
          return;
        }

        const normalizedAmount = amount;
        const updatedItems = selectedTileId
          ? (selectedTile?.items ?? []).map((item, index) =>
              index === entryIndex
                ? {
                    ...item,
                    quantity: normalizedAmount,
                    unit,
                    resolvedDensityEstimated: densityEstimated,
                  }
                : item
            )
          : selectedTile?.items ?? [];

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
            { merge: true }
          );

        setSavedTiles((prev) =>
          prev.map((tile) =>
            tile.id === selectedTileId ? { ...tile, items: updatedItems } : tile
          )
        );
        setAiConversions((prev) => {
          const next = { ...prev };
          delete next[entryKey];
          return next;
        });
      } catch (error) {
        console.error("AI conversion error:", error);
        Alert.alert("Conversion failed", "Please try again.");
      } finally {
        setAiLoading((prev) => ({ ...prev, [entryKey]: false }));
      }
    },
    [uid, selectedTileId, selectedTile]
  );

  return (
    <View style={styles.container}>
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
              style={styles.dropdownButton}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedTile
                  ? `Saved Ingredients (${selectedTile.items.length})`
                  : "Select saved ingredients"}
              </Text>
              <Ionicons
                name={dropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textLight}
              />
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdownList}>
                  {filteredTiles.map((tile, index) => (
                    <TouchableOpacity
                      key={tile.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTileId(tile.id);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        Saved Ingredients #{index + 1} ({tile.items.length})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.selectionSection}>
              {selectedTile && (
                <View style={styles.selectedTile}>
                  <View style={styles.tileHeader}>
                    <Text style={styles.tileTitle}>
                      Selected Ingredients ({selectedTile.items.length})
                    </Text>
                    <View style={styles.tileActions}>
                      <TouchableOpacity
                        onPress={handleEditSelected}
                        style={styles.editButton}
                        accessibilityLabel="Edit saved ingredients"
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.textLight}
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
                  <Text style={styles.legendText}>
                    Green = in cart • Yellow = unit mismatch
                  </Text>
                  <View style={styles.tileList}>
                    {(() => {
                      let totalSum = 0;
                      const rows = selectedTile.items.map((entry, entryIndex) => (
                        <View
                          key={`${selectedTile.id}-${entryIndex}`}
                          style={styles.tileItemRow}
                        >
                          {(() => {
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
                          const metaUnit = meta?.unit?.toLowerCase().trim() ?? "";
                          const resolvedUnit =
                            entry.resolvedUnit?.toLowerCase().trim() ?? "";
                          const resolvedQuantityValue =
                            typeof entry.resolvedQuantity === "number"
                              ? entry.resolvedQuantity
                              : NaN;
                          const densityEstimated = !!entry.resolvedDensityEstimated;
                          const autoPieceResolved = metaUnit === "piece";
                          const unitMismatch =
                            !!entryUnit && !!metaUnit && entryUnit !== metaUnit;
                          const isToTaste = /\bto taste\b/i.test(entryUnit);
                          const isSalt = normalizedName.includes("salt");
                          const toTasteAmount = isToTaste && isSalt ? 0.5 : NaN;
                          const unitPriceRaw = meta?.unitPrice?.toString() ?? "";
                          const unitPriceDisplay = unitPriceRaw
                            .replace(/rm\s*/i, "")
                            .trim();
                          const unitPriceValue = unitPriceRaw
                            ? parseFloat(unitPriceRaw.replace(/[^\d.]/g, ""))
                            : NaN;
                          const quantityValue = entry.quantity
                            ? parseFloat(
                                entry.quantity.toString().replace(/[^\d.]/g, "")
                              )
                            : NaN;
                          const booleanQuantity =
                            entry.quantity === true ? 1 : NaN;
                          const resolvedQuantityForDisplay = !Number.isNaN(quantityValue)
                            ? quantityValue
                            : !Number.isNaN(booleanQuantity)
                              ? booleanQuantity
                              : NaN;
                          const displayQuantity = !Number.isNaN(resolvedQuantityForDisplay)
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
                                volumeUnit
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
                              aiConversion.unit.toLowerCase() === meta.unit.toLowerCase()) ||
                            (!!resolvedUnit &&
                              !!metaUnit &&
                              resolvedUnit === metaUnit) ||
                            autoPieceResolved;
                          const effectiveAmount = resolvedMismatch
                            ? !Number.isNaN(toTasteAmount)
                              ? toTasteAmount
                              : autoPieceResolved
                                ? 1
                                : !Number.isNaN(resolvedQuantityValue) &&
                                    resolvedUnit === metaUnit
                                  ? resolvedQuantityValue
                                  : aiConversion?.value ?? conversion?.value
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
                                : aiConversion?.unit ?? conversion?.unit ?? meta?.unit ?? "";
                          const unitPriceLabel =
                            isMatch && meta && !Number.isNaN(unitPriceValue)
                              ? [unitPriceDisplay, priceUnit].filter(Boolean).join(" / ")
                              : "";
                          const totalLabel = isMatch
                            ? !Number.isNaN(totalPrice)
                              ? `RM ${totalPrice.toFixed(2)}`
                              : ""
                            : "";
                          const conversionLabel = !Number.isNaN(toTasteAmount)
                            ? `${toTasteAmount} g`
                            : autoPieceResolved
                              ? "1 piece"
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
                          const densityFlag = densityEstimated ? "AI density" : "";
                          const metaText = [unitPriceLabel, conversionLabel, densityFlag, totalLabel]
                            .filter((value) => {
                              if (!value) return false;
                              const text = value.toString().trim().toLowerCase();
                              return text !== "true" && text !== "false";
                            })
                            .join(" • ");

                          return (
                            <>
                              <Text
                                style={[
                                  styles.tileItem,
                                  styles.tileItemLabel,
                                  !isMatch && styles.tileItemDim,
                                  isMatch && styles.tileItemMatch,
                                  isMatch && unitMismatch && !resolvedMismatch && styles.tileItemWarn,
                                ]}
                              >
                                {"- "}
                                {displayQuantity}{" "}
                                {rawUnit ? `${rawUnit} ` : ""}
                                {ingredientName || "Unnamed"}
                              </Text>
                              {isMatch && metaText ? (
                                <Text
                                  style={[
                                    styles.tileItemMeta,
                                    !isMatch && styles.tileItemDim,
                                    isMatch && styles.tileItemMatch,
                                    isMatch && unitMismatch && !resolvedMismatch && styles.tileItemWarn,
                                  ]}
                                >
                                  {metaText}
                                </Text>
                              ) : null}
                              {showResolveButton ? (
                                <TouchableOpacity
                                  style={[
                                    styles.resolveButton,
                                    aiLoading[entryKey] && styles.resolveButtonDisabled,
                                  ]}
                                  onPress={() =>
                                    handleResolveMismatch(
                                      entry,
                                      entryIndex,
                                      entryKey,
                                      meta?.unit ?? null
                                    )
                                  }
                                  disabled={aiLoading[entryKey]}
                                >
                                  <Text style={styles.resolveButtonText}>
                                    {aiLoading[entryKey] ? "Fixing..." : "Fix"}
                                  </Text>
                                </TouchableOpacity>
                              ) : null}
                            </>
                          );
                        })()}
                        </View>
                      ));

                      return (
                        <>
                          {rows}
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>
                              {totalSum > 0 ? `RM ${totalSum.toFixed(2)}` : "RM -"}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 16,
  },
  infoText: {
    paddingHorizontal: 16,
    paddingTop: 10,
    color: colors.textLight,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.textLight,
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
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: colors.black,
    fontWeight: "600",
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.black,
  },
  selectedTile: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
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
  legendText: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  tileList: {
    gap: 6,
  },
  tileItemRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  tileItem: {
    fontSize: 14,
    color: colors.textLight,
  },
  tileItemLabel: {
    flex: 1,
    paddingRight: 6,
  },
  tileItemMeta: {
    fontSize: 12,
    color: colors.textLight,
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
    color: colors.black,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
  },
  resolveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#0b7a2a",
  },
  resolveButtonDisabled: {
    opacity: 0.6,
  },
  resolveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
