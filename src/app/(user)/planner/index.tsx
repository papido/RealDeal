import { auth, firestore } from "@/config/firebase";
import { colors } from "@/src/constants/theme";
import { ParsedIngredient } from "@/src/constants/types";
import SwipeToDelete from "@/src/components/SwipeToDelete";
import { useCurrency } from "@/src/contexts/CurrencyProvider";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

type PlannerEntry = {
  id: string;
  recipeId?: string;
  recipeName?: string;
  recipeWebsite?: string;
  items?: ParsedIngredient[];
  totalPrice?: number;
  plannedFor?: any;
  createdAt?: any;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    const converted = value.toDate();
    return converted instanceof Date ? converted : null;
  }
  return null;
};

const PlannerScreen = () => {
  const [uid, setUid] = useState<string | null>(auth().currentUser?.uid ?? null);
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [showWebsitePrompt, setShowWebsitePrompt] = useState(false);
  const [websiteInput, setWebsiteInput] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [savingWebsite, setSavingWebsite] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .collection("plannerEntries")
      .orderBy("plannedFor", "desc")
      .onSnapshot(
        (snapshot) => {
          const nextEntries = snapshot.docs.map((doc) => {
            const data = doc.data() as Omit<PlannerEntry, "id">;
            return {
              id: doc.id,
              ...data,
            };
          });
          setEntries(nextEntries);
          setLoading(false);
        },
        (error) => {
          console.error("Error loading planner entries:", error);
          setEntries([]);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [uid]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aTime = toDate(a.plannedFor)?.getTime() ?? 0;
      const bTime = toDate(b.plannedFor)?.getTime() ?? 0;
      return bTime - aTime;
    });
  }, [entries]);

  const handleDeleteEntry = async (entryId: string) => {
    if (!uid) return;
    try {
      await firestore()
        .collection("users")
        .doc(uid)
        .collection("plannerEntries")
        .doc(entryId)
        .delete();
    } catch (error) {
      console.error("Error deleting planner entry:", error);
    }
  };

  const normalizeWebsiteUrl = (rawValue: string): string | null => {
    const trimmed = rawValue.trim();
    if (!trimmed) return null;
    const candidate = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return /^https?:\/\/\S+$/i.test(candidate) ? candidate : null;
  };

  const handleOpenWebsite = (entry: PlannerEntry) => {
    const savedUrl = entry.recipeWebsite?.trim();
    if (savedUrl) {
      setWebsiteUrl(savedUrl);
      return;
    }

    setSelectedEntryId(entry.id);
    setWebsiteInput("");
    setShowWebsitePrompt(true);
  };

  const handleSaveWebsite = async () => {
    if (!uid || !selectedEntryId || savingWebsite) return;
    const normalizedUrl = normalizeWebsiteUrl(websiteInput);
    if (!normalizedUrl) {
      Alert.alert("Invalid website", "Please enter a valid website URL.");
      return;
    }

    try {
      setSavingWebsite(true);
      await firestore()
        .collection("users")
        .doc(uid)
        .collection("plannerEntries")
        .doc(selectedEntryId)
        .set(
          {
            recipeWebsite: normalizedUrl,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      setShowWebsitePrompt(false);
      setSelectedEntryId(null);
      setWebsiteInput("");
      setWebsiteUrl(normalizedUrl);
    } catch (error) {
      console.error("Error saving recipe website:", error);
      Alert.alert("Failed to save", "Please try again.");
    } finally {
      setSavingWebsite(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!uid) {
    return (
      <LinearGradient
        colors={["#0b1f16", "#0f2a1c", "#122f21"]}
        style={styles.page}
      >
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Please sign in to view planner.</Text>
        </View>
      </LinearGradient>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <LinearGradient
        colors={["#0b1f16", "#0f2a1c", "#122f21"]}
        style={styles.page}
      >
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No planner entries yet. Long press a recipe name in Menu to add one.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0b1f16", "#0f2a1c", "#122f21"]}
      style={styles.page}
    >
      <FlatList
        contentContainerStyle={styles.listContent}
        data={sortedEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const plannedDate = toDate(item.plannedFor);

          return (
            <SwipeToDelete onDelete={() => handleDeleteEntry(item.id)}>
              <Pressable
                onPress={() => handleOpenWebsite(item)}
                style={styles.cardPressable}
                accessibilityRole="button"
                accessibilityLabel="Open recipe website"
              >
                <LinearGradient
                  colors={["#fef3c7", "#fde68a"]}
                  style={styles.card}
                >
                  <View style={styles.dateRow}>
                    <View style={styles.datePill}>
                      <Text style={styles.datePillText}>
                        {plannedDate
                          ? `${plannedDate.toLocaleDateString()}`
                          : "Date TBD"}
                      </Text>
                    </View>
                    <View style={styles.timePill}>
                      <Text style={styles.timePillText}>
                        {plannedDate
                          ? plannedDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-- : --"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recipePressable}>
                    <Text style={styles.recipeName}>
                      {item.recipeName?.trim() || "Saved Ingredients"}
                    </Text>
                    <Text style={styles.totalPriceText}>
                      Total:{" "}
                      {typeof item.totalPrice === "number" && item.totalPrice > 0
                        ? formatCurrency(item.totalPrice)
                        : "-"}
                    </Text>
                    <Text style={styles.viewHint}>Tap to open website</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </SwipeToDelete>
          );
        }}
      />
      {websiteUrl ? (
        <View style={styles.websiteOverlay}>
          <View style={styles.websiteHeader}>
            <Text style={styles.websiteTitle}>Recipe website</Text>
            <Pressable
              onPress={() => setWebsiteUrl(null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close website"
            >
              <Ionicons name="close" size={20} color="#111827" />
            </Pressable>
          </View>
          <WebView source={{ uri: websiteUrl }} />
        </View>
      ) : null}

      <Modal
        visible={showWebsitePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingWebsite) {
            setShowWebsitePrompt(false);
            setSelectedEntryId(null);
            setWebsiteInput("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add recipe website</Text>
            <Text style={styles.modalSubtitle}>
              Add the recipe URL for this planner card.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://example.com/recipe"
              placeholderTextColor="#9ca3af"
              value={websiteInput}
              onChangeText={setWebsiteInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowWebsitePrompt(false);
                  setSelectedEntryId(null);
                  setWebsiteInput("");
                }}
                style={[styles.modalButton, styles.modalCancelButton]}
                disabled={savingWebsite}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveWebsite}
                style={[styles.modalButton, styles.modalSaveButton]}
                disabled={savingWebsite}
              >
                <Text style={styles.modalSaveText}>
                  {savingWebsite ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default PlannerScreen;

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  page: {
    flex: 1,
    backgroundColor: "transparent",
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 6,
  },
  cardPressable: {
    borderRadius: 20,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  datePill: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  datePillText: {
    color: "#fef9c3",
    fontSize: 12,
    fontWeight: "600",
  },
  timePill: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  timePillText: {
    color: "#fef9c3",
    fontSize: 12,
    fontWeight: "600",
  },
  recipePressable: {
    justifyContent: "center",
  },
  recipeName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  totalPriceText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#0b7a2a",
  },
  viewHint: {
    marginTop: 4,
    fontSize: 13,
    color: "#475467",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  emptyText: {
    textAlign: "center",
    color: "#e2e8f0",
    fontSize: 15,
  },
  websiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 100,
  },
  websiteHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  websiteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
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
    fontSize: 13,
    color: "#cbd5f5",
  },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#f8fafc",
    backgroundColor: "#1f2937",
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
    backgroundColor: "#374151",
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
});
