import { auth, firestore } from "@/config/firebase";
import { colors } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [savedTiles, setSavedTiles] = useState<SavedTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
              <View style={styles.tileList}>
                {selectedTile.items.map((entry, entryIndex) => (
                  <Text
                    key={`${selectedTile.id}-${entryIndex}`}
                    style={styles.tileItem}
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
  tileList: {
    gap: 6,
  },
  tileItem: {
    fontSize: 14,
    color: colors.textLight,
  },
});
