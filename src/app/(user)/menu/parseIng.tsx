import { auth, firestore } from "@/config/firebase";
import Button from "@/src/components/Button";
import { ParsedIngredient } from "@/src/constants/types";
import { parseENLine } from "@/src/utils/enParser";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, {
  JSX,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Button as RNButton,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type EditableField = keyof Pick<
  ParsedIngredient,
  "quantity" | "unit" | "ingredient"
>;

type SavedIngredientPayload = {
  quantity: string | number | null;
  unit: string | null;
  ingredient: string | null;
  resolvedQuantity: number | null;
  resolvedUnit: string | null;
  resolvedDensityEstimated: boolean | null;
};

export default function IngredientParser(): JSX.Element {
  const {
    items,
    editAll,
    tileId,
    recipeName: recipeNameParam,
  } = useLocalSearchParams<{
    items?: string;
    editAll?: string;
    tileId?: string;
    recipeName?: string;
  }>();
  const navigation = useNavigation();
  const [rawText, setRawText] = useState<string>("");
  const [parsedIngredients, setParsedIngredients] = useState<
    ParsedIngredient[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [editAllMode, setEditAllMode] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [showRecipeNamePrompt, setShowRecipeNamePrompt] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [pendingExitEditAll, setPendingExitEditAll] = useState(false);
  const [showWebsiteSheet, setShowWebsiteSheet] = useState(false);

  // inline edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftIngredient, setDraftIngredient] = useState<string>("");
  const [draftQuantity, setDraftQuantity] = useState<string>("");
  const [draftUnit, setDraftUnit] = useState<string>("");
  const isEditingFromMenu = !!tileId;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitleText}>Parse Ingredients</Text>
          <Pressable
            onPress={() => setShowGuidanceModal(true)}
            hitSlop={8}
            style={styles.headerHintButton}
            accessibilityRole="button"
            accessibilityLabel="Show ingredient parsing guidance"
          >
            <Ionicons name="help-circle-outline" size={26} color="#111827" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!items) return;
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return;
      setParsedIngredients(parsed as ParsedIngredient[]);
      setEditingIndex(null);
      setDraftIngredient("");
      setEditAllMode(editAll === "1");
      setRecipeName(typeof recipeNameParam === "string" ? recipeNameParam : "");
    } catch (error) {
      console.error("Error loading saved ingredients:", error);
    }
  }, [items, editAll, recipeNameParam]);

  useFocusEffect(
    useCallback(() => {
      return () => setShowWebsiteSheet(false);
    }, []),
  );

  const lines = useMemo(
    () =>
      rawText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [rawText],
  );
  const websiteSheetHeight = useMemo(() => 260, []);

  const handleParse = (): void => {
    const parsed = lines.map((line) => parseENLine(line) as ParsedIngredient);
    setParsedIngredients(parsed);
    setEditingIndex(null);
    setDraftIngredient("");
    setEditAllMode(true);
  };

  const handleFindWebsite = (): void => {
    setShowWebsiteSheet(true);
  };

  const editIngredient = (
    index: number,
    field: EditableField,
    value: string,
  ): void => {
    setParsedIngredients((prev) => {
      const updated = [...prev];
      const current = updated[index] ?? {};
      updated[index] = { ...current, [field]: value };
      return updated;
    });
  };

  const startEdit = (index: number): void => {
    setEditingIndex(index);
    setDraftIngredient(parsedIngredients[index]?.ingredient ?? "");
    setDraftQuantity((parsedIngredients[index]?.quantity ?? "").toString());
    setDraftUnit(parsedIngredients[index]?.unit ?? "");
  };

  const doneEdit = (): void => {
    if (editingIndex === null) return;
    editIngredient(editingIndex, "quantity", draftQuantity);
    editIngredient(editingIndex, "unit", draftUnit);
    editIngredient(editingIndex, "ingredient", draftIngredient);
    setEditingIndex(null);
    setDraftIngredient("");
    setDraftQuantity("");
    setDraftUnit("");
  };

  const handleDeleteIngredient = (index: number): void => {
    setParsedIngredients((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraftIngredient("");
      setDraftQuantity("");
      setDraftUnit("");
    }
  };

  const handleAddIngredient = (): void => {
    setParsedIngredients((prev) => [
      ...prev,
      { quantity: "", unit: "", ingredient: "" },
    ]);
    setEditAllMode(true);
    setEditingIndex(null);
    setDraftIngredient("");
    setDraftQuantity("");
    setDraftUnit("");
  };

  const buildCleanIngredients = (): SavedIngredientPayload[] =>
    parsedIngredients
      .map(
        ({
          quantity,
          unit,
          ingredient,
          resolvedQuantity,
          resolvedUnit,
          resolvedDensityEstimated,
        }) => ({
          quantity: quantity ?? null,
          unit: unit ?? null,
          ingredient: ingredient?.trim() || null,
          resolvedQuantity: resolvedQuantity ?? null,
          resolvedUnit: resolvedUnit ?? null,
          resolvedDensityEstimated: resolvedDensityEstimated ?? null,
        }),
      )
      .filter((item) => item.ingredient);

  const saveIngredients = async (
    cleanIngredients: SavedIngredientPayload[],
    recipeNameValue: string,
  ): Promise<boolean> => {
    if (!cleanIngredients.length || saving) return false;

    const uid = auth().currentUser?.uid ?? null;
    if (!uid) {
      console.error("Cannot save ingredients without a signed-in user.");
      return false;
    }

    try {
      setSaving(true);
      const collection = firestore()
        .collection("users")
        .doc(uid)
        .collection("parsedIngredients");

      const docRef = tileId ? collection.doc(tileId) : collection.doc();
      await docRef.set(
        {
          recipeName: recipeNameValue,
          items: cleanIngredients,
          ...(tileId
            ? { updatedAt: firestore.FieldValue.serverTimestamp() }
            : { createdAt: firestore.FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "index", params: { selectedTileId: docRef.id } }],
        }),
      );
      return true;
    } catch (error) {
      console.error("Error saving parsed ingredients:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSavePress = async (
    exitEditAllOnSuccess = false,
  ): Promise<void> => {
    const cleanIngredients = buildCleanIngredients();

    if (!cleanIngredients.length || saving) return;

    const trimmedRecipeName = recipeName.trim();
    if (!trimmedRecipeName) {
      setPendingExitEditAll(exitEditAllOnSuccess);
      setShowRecipeNamePrompt(true);
      return;
    }

    const didSave = await saveIngredients(cleanIngredients, trimmedRecipeName);
    if (didSave && exitEditAllOnSuccess) {
      setEditAllMode(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {isEditingFromMenu && (
          <>
            <Text style={styles.recipeNameLabel}>Recipe name</Text>
            <TextInput
              style={styles.recipeNameInput}
              placeholder="Recipe name"
              value={recipeName}
              onChangeText={setRecipeName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </>
        )}

        {!isEditingFromMenu && (
          <>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Paste ingredients here"
              value={rawText}
              onChangeText={setRawText}
            />

            <View style={styles.actionsRow}>
              <View style={styles.actionsLeft}>
                <RNButton title="Parse" onPress={handleParse} />
                <View style={styles.buttonSpacer} />
                <RNButton
                  title="Clear"
                  onPress={() => {
                    setRawText("");
                    setParsedIngredients([]);
                    setEditingIndex(null);
                    setDraftIngredient("");
                    setDraftQuantity("");
                    setDraftUnit("");
                  }}
                />
              </View>
              <Pressable
                onPress={handleFindWebsite}
                style={styles.findWebsiteButton}
                accessibilityRole="button"
                accessibilityLabel="Find website"
              >
                <Ionicons name="globe-outline" size={16} color="#fff" />
                <Text style={styles.findWebsiteText}>Find recipe website</Text>
              </Pressable>
            </View>
          </>
        )}

        <FlatList<ParsedIngredient>
          data={parsedIngredients}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            parsedIngredients.length ? (
              <View style={styles.listHeader}>
                <Text
                  style={[
                    styles.headerText,
                    styles.cellSmall,
                    styles.headerPad,
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    styles.headerText,
                    styles.cellUnit,
                    styles.headerPadUnit,
                  ]}
                >
                  Unit
                </Text>
                <Text
                  style={[styles.headerText, styles.cellGrow, styles.headerPad]}
                >
                  Ingredient
                </Text>
                <Text style={styles.headerText}>Actions</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Paste and parse to see results.
            </Text>
          }
          renderItem={({ item, index }) => {
            const isEditing = !editAllMode && editingIndex === index;

            return (
              <View style={styles.listRow}>
                {editAllMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.cellSmall,
                        styles.inlineInput,
                        styles.inlineInputSmall,
                      ]}
                      value={(item.quantity ?? "").toString()}
                      onChangeText={(text) =>
                        editIngredient(index, "quantity", text)
                      }
                      placeholder="Qty"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[
                        styles.inlineInput,
                        styles.inlineInputUnit,
                        styles.cellUnit,
                      ]}
                      value={item.unit ?? ""}
                      onChangeText={(text) =>
                        editIngredient(index, "unit", text)
                      }
                      placeholder="Unit"
                    />
                    <TextInput
                      style={[
                        styles.inlineInput,
                        styles.inlineInputIngredient,
                        styles.cellGrow,
                      ]}
                      value={item.ingredient ?? ""}
                      onChangeText={(text) =>
                        editIngredient(index, "ingredient", text)
                      }
                      placeholder="Ingredient"
                    />
                    <View style={styles.actionCell}>
                      <Pressable
                        onPress={() => handleDeleteIngredient(index)}
                        style={styles.iconButton}
                        accessibilityLabel="Delete ingredient"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#b91c1c"
                        />
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.cellSmall,
                          styles.inlineInput,
                          styles.inlineInputSmall,
                        ]}
                        value={draftQuantity}
                        onChangeText={setDraftQuantity}
                        placeholder="Qty"
                        keyboardType="numeric"
                        autoFocus
                        returnKeyType="next"
                      />
                    ) : (
                      <Text style={styles.cellSmall}>
                        {item.quantity ?? "?"}
                      </Text>
                    )}

                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.inlineInput,
                          styles.inlineInputUnit,
                          styles.cellUnit,
                        ]}
                        value={draftUnit}
                        onChangeText={setDraftUnit}
                        placeholder="Unit"
                        returnKeyType="next"
                      />
                    ) : (
                      <Text style={styles.cellUnit}>{item.unit ?? "?"}</Text>
                    )}

                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.inlineInput,
                          styles.inlineInputIngredient,
                        ]}
                        value={draftIngredient}
                        onChangeText={setDraftIngredient}
                        placeholder="Ingredient"
                        onSubmitEditing={doneEdit}
                        returnKeyType="done"
                      />
                    ) : (
                      <Text style={styles.cellGrow}>
                        {item.ingredient ?? "?"}
                      </Text>
                    )}

                    {isEditing ? (
                      <View style={styles.actionButtons}>
                        <Pressable onPress={doneEdit} style={styles.linkButton}>
                          <Text style={styles.linkButtonText}>Done</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteIngredient(index)}
                          style={styles.linkButton}
                          accessibilityLabel="Delete ingredient"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#b91c1c"
                          />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.actionButtons}>
                        <Pressable
                          onPress={() => startEdit(index)}
                          style={styles.iconButton}
                          accessibilityLabel="Edit ingredient"
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color="#1a73e8"
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteIngredient(index)}
                          style={styles.iconButton}
                          accessibilityLabel="Delete ingredient"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#b91c1c"
                          />
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            parsedIngredients.length ? (
              <View style={styles.listFooter}>
                <RNButton title="Add" onPress={handleAddIngredient} />
              </View>
            ) : null
          }
        />

        <Modal
          visible={showGuidanceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGuidanceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Parsing guidance</Text>

              <Text style={styles.guidanceLine}>
                1. Press Find recipe website button and search your recipe
                website.
              </Text>
              <Text style={styles.guidanceLine}>
                2. Copy the ingredients and paste in text box 'Parse ingredients
                here'
              </Text>
              <Text style={styles.guidanceLine}>
                3. Make sure in quantity + unit + ingredient format.
              </Text>
              <Text style={styles.guidanceLine}>
                4. Keep ingredient name short (max 2 words)
              </Text>
              <Text style={styles.guidanceLine}>
                5. Avoid duplicate ingredients in parsing or cart.
              </Text>
              <Text style={styles.guidanceLine}>
                6. Avoid extra notes on the same line.
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setShowGuidanceModal(false)}
                  style={[styles.modalButton, styles.modalSaveButton]}
                >
                  <Text style={styles.modalSaveText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showRecipeNamePrompt}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!saving) {
              setShowRecipeNamePrompt(false);
              setPendingExitEditAll(false);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add recipe name</Text>
              <Text style={styles.modalSubtitle}>
                Enter a recipe name before saving.
              </Text>
              <TextInput
                style={styles.modalInput}
                value={recipeName}
                onChangeText={setRecipeName}
                placeholder="e.g. Chicken Curry"
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={async () => {
                  const cleanIngredients = buildCleanIngredients();
                  const trimmedRecipeName = recipeName.trim();
                  if (!trimmedRecipeName) {
                    Alert.alert(
                      "Recipe name required",
                      "Please add a recipe name.",
                    );
                    return;
                  }
                  setShowRecipeNamePrompt(false);
                  const didSave = await saveIngredients(
                    cleanIngredients,
                    trimmedRecipeName,
                  );
                  if (didSave && pendingExitEditAll) {
                    setEditAllMode(false);
                  }
                  setPendingExitEditAll(false);
                }}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setShowRecipeNamePrompt(false);
                    setPendingExitEditAll(false);
                  }}
                  style={[styles.modalButton, styles.modalCancelButton]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    const cleanIngredients = buildCleanIngredients();
                    const trimmedRecipeName = recipeName.trim();
                    if (!trimmedRecipeName) {
                      Alert.alert(
                        "Recipe name required",
                        "Please add a recipe name.",
                      );
                      return;
                    }
                    setShowRecipeNamePrompt(false);
                    const didSave = await saveIngredients(
                      cleanIngredients,
                      trimmedRecipeName,
                    );
                    if (didSave && pendingExitEditAll) {
                      setEditAllMode(false);
                    }
                    setPendingExitEditAll(false);
                  }}
                  style={[styles.modalButton, styles.modalSaveButton]}
                  disabled={saving}
                >
                  <Text style={styles.modalSaveText}>
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {editAllMode ? (
          <Button
            style={styles.saveButton}
            onPress={() => handleSavePress(true)}
            loading={saving}
            disabled={saving || parsedIngredients.length === 0}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Done & Save"}
            </Text>
          </Button>
        ) : (
          <Button
            style={styles.saveButton}
            onPress={() => handleSavePress(false)}
            loading={saving}
            disabled={saving || parsedIngredients.length === 0}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </Button>
        )}
        {showWebsiteSheet ? (
          <View style={styles.websiteOverlay}>
            <View style={styles.websiteHeader}>
              <Text style={styles.websiteTitle}>Find recipe website</Text>
              <Pressable
                onPress={() => setShowWebsiteSheet(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close website"
              >
                <Ionicons name="close" size={18} color="#111827" />
              </Pressable>
            </View>
            <WebView source={{ uri: "https://www.google.com" }} />
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    height: 120,
    marginBottom: 12,
    borderRadius: 10,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  recipeNameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  recipeNameLabel: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 3,
  },
  actionsRow: {
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  buttonSpacer: {
    width: 10,
  },
  findWebsiteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0b7a2a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 8,
  },
  findWebsiteText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  websiteOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 140,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  websiteHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  websiteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  listContent: {
    paddingBottom: 16,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 2,
  },
  headerText: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerPad: {
    marginLeft: 6,
  },
  headerPadUnit: {
    marginLeft: 10,
  },
  listRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  cellSmall: {
    width: 28,
    paddingRight: 2,
  },
  cellUnit: {
    width: 90,
    marginLeft: -4,
    paddingRight: 12,
  },
  cellGrow: {
    flex: 1,
    paddingRight: 8,
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  inlineInputSmall: {
    flex: 0,
    width: 40,
    paddingHorizontal: 6,
    marginLeft: 0,
    marginRight: 8,
  },
  inlineInputUnit: {
    flex: 0,
    width: 110,
    paddingHorizontal: 6,
    // marginLeft: 4,
  },
  inlineInputIngredient: {
    marginLeft: 4,
  },
  linkButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionCell: {
    width: 28,
    alignItems: "center",
  },
  linkButtonText: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  listFooter: {
    marginTop: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    height: 48,
    marginVertical: 4,
    marginBottom: 0,
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    backgroundColor: "#f3f4f6",
  },
  modalSaveButton: {
    backgroundColor: "#1a73e8",
  },
  modalCancelText: {
    color: "#111827",
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
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  headerHintButton: {
    marginLeft: 6,
    paddingVertical: 3,
  },
  guidancePattern: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  guidanceLine: {
    marginTop: 10,
    fontSize: 13,
    color: "#374151",
  },
  guidanceBullet: {
    marginTop: 6,
    fontSize: 13,
    color: "#374151",
  },
});
