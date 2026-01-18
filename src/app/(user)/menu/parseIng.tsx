import { auth, firestore } from "@/config/firebase";
import Button from "@/src/components/Button";
import { ParsedIngredient } from "@/src/constants/types";
import { parseENLine } from "@/src/utils/enParser";
import { useLocalSearchParams } from "expo-router";
import React, { JSX, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button as RNButton,
  FlatList,
  Pressable,
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
  const { items, editAll } = useLocalSearchParams<{
    items?: string;
    editAll?: string;
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
    [rawText]
  );

  const handleParse = (): void => {
    const parsed = lines.map((line) => parseENLine(line) as ParsedIngredient);
    setParsedIngredients(parsed);
    setEditingIndex(null);
    setDraftIngredient("");
  };

  const editIngredient = (
    index: number,
    field: EditableField,
    value: string
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
  };

  const doneEdit = (): void => {
    if (editingIndex === null) return;
    editIngredient(editingIndex, "ingredient", draftIngredient);
    setEditingIndex(null);
    setDraftIngredient("");
  };

  const handleSave = async (): Promise<void> => {
    const cleanIngredients = parsedIngredients
      .map(({ quantity, unit, ingredient }) => ({
        quantity: quantity ?? null,
        unit: unit ?? null,
        ingredient: ingredient?.trim() || null,
      }))
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

      const docRef = collection.doc();
      await docRef.set({
        items: cleanIngredients,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
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
              <Text style={[styles.headerText, styles.cellSmall]}>Qty</Text>
              <Text style={[styles.headerText, styles.cellSmall]}>Unit</Text>
              <Text style={[styles.headerText, styles.cellGrow]}>
                Ingredient
              </Text>
              <Text style={styles.headerText}>Edit</Text>
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
                    style={[styles.inlineInput, styles.cellSmall]}
                    value={(item.quantity ?? "").toString()}
                    onChangeText={(text) =>
                      editIngredient(index, "quantity", text)
                    }
                    placeholder="Qty"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.inlineInput, styles.cellSmall]}
                    value={item.unit ?? ""}
                    onChangeText={(text) =>
                      editIngredient(index, "unit", text)
                    }
                    placeholder="Unit"
                  />
                  <TextInput
                    style={[styles.inlineInput, styles.cellGrow]}
                    value={item.ingredient ?? ""}
                    onChangeText={(text) =>
                      editIngredient(index, "ingredient", text)
                    }
                    placeholder="Ingredient"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.cellSmall}>{item.quantity ?? "?"}</Text>
                  <Text style={styles.cellSmall}>{item.unit ?? "?"}</Text>

                  {isEditing ? (
                    <TextInput
                      style={styles.inlineInput}
                      value={draftIngredient}
                      onChangeText={setDraftIngredient}
                      placeholder="Ingredient"
                      autoFocus
                      onSubmitEditing={doneEdit}
                      returnKeyType="done"
                    />
                  ) : (
                    <Text style={styles.cellGrow}>{item.ingredient ?? "?"}</Text>
                  )}

                  {isEditing ? (
                    <Pressable onPress={doneEdit} style={styles.linkButton}>
                      <Text style={styles.linkButtonText}>Done</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => startEdit(index)}>
                      <Text style={styles.linkButtonText}>Edit</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          );
        }}
      />

      {editAllMode ? (
        <Button
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
    marginBottom: 12,
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
    marginBottom: 4,
  },
  headerText: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  cellSmall: {
    width: 70,
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
  linkButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkButtonText: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 16,
  },
});
