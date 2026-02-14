import { auth, firestore } from "@/config/firebase";
import { colors } from "@/src/constants/theme";
import { ParsedIngredient } from "@/src/constants/types";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type PlannerEntry = {
  id: string;
  recipeId?: string;
  recipeName?: string;
  items?: ParsedIngredient[];
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
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

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
      .orderBy("plannedFor", "asc")
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
      return aTime - bTime;
    });
  }, [entries]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!uid) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Please sign in to view planner.</Text>
      </View>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          No planner entries yet. Long press a recipe name in Menu to add one.
        </Text>
      </View>
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
          const isExpanded = !!expandedIds[item.id];

          return (
            <Pressable
              onPress={() =>
                setExpandedIds((prev) => ({
                  ...prev,
                  [item.id]: !prev[item.id],
                }))
              }
              style={styles.cardPressable}
              accessibilityRole="button"
              accessibilityLabel="Toggle planned recipe ingredients"
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
                <Text style={styles.viewHint}>
                  {isExpanded ? "Hide ingredients" : "Show ingredients"}
                </Text>
              </View>

              {isExpanded ? (
                <View style={styles.ingredientsWrap}>
                  {(item.items ?? []).map((entry, index) => {
                    const quantity =
                      entry.quantity !== null && entry.quantity !== undefined
                        ? `${entry.quantity}`
                        : "";
                    const unit = entry.unit ?? "";
                    const ingredient =
                      entry.ingredient ?? "Unnamed ingredient";

                    return (
                      <Text
                        key={`${item.id}-${index}`}
                        style={styles.ingredientText}
                      >
                        - {[quantity, unit, ingredient].filter(Boolean).join(" ")}
                      </Text>
                    );
                  })}
                </View>
              ) : null}
              </LinearGradient>
            </Pressable>
          );
        }}
      />
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
    marginBottom: 16,
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
  viewHint: {
    marginTop: 4,
    fontSize: 13,
    color: "#475467",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ingredientsWrap: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,24,39,0.1)",
    paddingTop: 12,
    gap: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: "#1e293b",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0f172a",
  },
  emptyText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
  },
});
