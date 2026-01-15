import { auth, firestore } from "@/config/firebase";
import { colors } from "@/src/constants/theme";
import { ParsedIngredient } from "@/src/constants/types";
import { useCart } from "@/src/contexts/CartProvider";
import { useIngredients } from "@/src/contexts/IngredientsProvider";
import { findCartMatches } from "@/src/utils/ingredientMatching";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SavedIngredient = {
  quantity?: string | null;
  unit?: string | null;
  ingredient?: string | null;
};

type SavedTile = {
  id: string;
  items: SavedIngredient[];
  createdAt?: any;
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
  const [savedTiles, setSavedTiles] = useState<SavedTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusTick, setFocusTick] = useState(0);
  const cleanupOnceRef = useRef(false);

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

    const unsubscribe = collectionRef
      .orderBy("createdAt", "desc")
      .onSnapshot(
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
        .map((item) => (item.ingredient ?? "").toLowerCase().trim())
        .filter(Boolean)
    );
  }, [selectedTile, cartItems, ingredients, focusTick]);

  return (
    <View style={styles.container}>
      {ingredientsFromCart && (
        <Text style={styles.infoText}>
          Showing ingredients for: {ingredientsFromCart.replace(/,/g, ", ")}
        </Text>
      )}
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
        <View style={styles.selectionSection}>
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
          )}
          {selectedTile && (
            <View style={styles.selectedTile}>
              <Text style={styles.tileTitle}>
                Selected Ingredients ({selectedTile.items.length})
              </Text>
              <Text style={styles.legendText}>Green = in cart</Text>
              <View style={styles.tileList}>
                {selectedTile.items.map((entry, entryIndex) => (
                  <Text
                    key={`${selectedTile.id}-${entryIndex}`}
                    style={[
                      styles.tileItem,
                      !(
                        entry.ingredient &&
                        matchedIngredientSet.has(
                          entry.ingredient.toLowerCase().trim()
                        )
                      ) && styles.tileItemDim,
                      entry.ingredient &&
                        matchedIngredientSet.has(
                          entry.ingredient.toLowerCase().trim()
                        ) &&
                        styles.tileItemMatch,
                    ]}
                  >
                    {"- "}
                    {entry.ingredient || "Unnamed"} ({entry.quantity ?? "?"}{" "}
                    {entry.unit ?? ""})
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
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
    paddingVertical: 16,
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
    marginBottom: 10,
  },
  legendText: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  tileList: {
    gap: 6,
  },
  tileItem: {
    fontSize: 14,
    color: colors.textLight,
  },
  tileItemDim: {
    color: "#6b7280",
  },
  tileItemMatch: {
    color: "#0b7a2a",
    fontWeight: "700",
  },
});
