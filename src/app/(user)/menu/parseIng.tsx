import { auth, firestore } from "@/config/firebase";
import Button from "@/src/components/Button";
import { ParsedIngredient } from "@/src/constants/types";
import { parseENLine } from "@/src/utils/enParser";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { JSX, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Button as RNButton,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type EditableField = keyof Pick<
  ParsedIngredient,
  "quantity" | "unit" | "ingredient"
>;

export default function IngredientParser(): JSX.Element {
  const { items, editAll, tileId } = useLocalSearchParams<{
    items?: string;
    editAll?: string;
    tileId?: string;
  }>();
  const [rawText, setRawText] = useState<string>("");
  const [parsedIngredients, setParsedIngredients] = useState<
    ParsedIngredient[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [editAllMode, setEditAllMode] = useState(false);

  // inline edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftIngredient, setDraftIngredient] = useState<string>("");
  const [draftQuantity, setDraftQuantity] = useState<string>("");
  const [draftUnit, setDraftUnit] = useState<string>("");

  useEffect(() => {
    if (!items) return;
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return;
      setParsedIngredients(parsed as ParsedIngredient[]);
      setEditingIndex(null);
      setDraftIngredient("");
      setEditAllMode(editAll === "1");
    } catch (error) {
      console.error("Error loading saved ingredients:", error);
    }
  }, [items, editAll]);

  const lines = useMemo(
    () =>
      rawText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [rawText],
  );

  const handleParse = (): void => {
    const parsed = lines.map((line) => parseENLine(line) as ParsedIngredient);
    setParsedIngredients(parsed);
    setEditingIndex(null);
    setDraftIngredient("");
    setEditAllMode(true);
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

  const handleSave = async (): Promise<void> => {
    const cleanIngredients = parsedIngredients
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

    if (!cleanIngredients.length || saving) return;

    const uid = auth().currentUser?.uid ?? null;
    if (!uid) {
      console.error("Cannot save ingredients without a signed-in user.");
      return;
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
          items: cleanIngredients,
          ...(tileId
            ? { updatedAt: firestore.FieldValue.serverTimestamp() }
            : { createdAt: firestore.FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
      Alert.alert("Saved", "Ingredients saved successfully.");
    } catch (error) {
      console.error("Error saving parsed ingredients:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
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
      </View>

      <FlatList<ParsedIngredient>
        data={parsedIngredients}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          parsedIngredients.length ? (
            <View style={styles.listHeader}>
              <Text
                style={[styles.headerText, styles.cellSmall, styles.headerPad]}
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
          <Text style={styles.emptyText}>Paste and parse to see results.</Text>
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
                    onChangeText={(text) => editIngredient(index, "unit", text)}
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
                    <Text style={styles.cellSmall}>{item.quantity ?? "?"}</Text>
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
                      style={[styles.inlineInput, styles.inlineInputIngredient]}
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

      {editAllMode ? (
        <Button
          style={styles.saveButton}
          onPress={async () => {
            await handleSave();
            setEditAllMode(false);
          }}
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
          onPress={handleSave}
          loading={saving}
          disabled={saving || parsedIngredients.length === 0}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Button>
      )}
    </View>
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
  actionsRow: {
    marginBottom: 2,
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  buttonSpacer: {
    width: 10,
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
});
