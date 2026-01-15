import { auth, firestore } from "@/config/firebase";
import { ParsedIngredient } from "@/src/constants/types";
import { parseBMLine } from "@/src/utils/bmParser";
import { parseENLine } from "@/src/utils/enParser";
import React, { JSX, useMemo, useState } from "react";
import {
  Alert,
  Button,
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
  const [rawText, setRawText] = useState<string>("");
  const [parsedIngredients, setParsedIngredients] = useState<
    ParsedIngredient[]
  >([]);
  const [parserLang, setParserLang] = useState<"bm" | "en">("bm");
  const [saving, setSaving] = useState(false);

  // inline edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftIngredient, setDraftIngredient] = useState<string>("");

  const lines = useMemo(
    () =>
      rawText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [rawText]
  );

  const handleParse = (): void => {
    const parser = parserLang === "en" ? parseENLine : parseBMLine;
    const parsed = lines.map((line) => parser(line) as ParsedIngredient);
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
          <Button title="Parse" onPress={handleParse} />
          <View style={styles.buttonSpacer} />
          <Button
            title="Clear"
            onPress={() => {
              setRawText("");
              setParsedIngredients([]);
              setEditingIndex(null);
              setDraftIngredient("");
            }}
          />
        </View>
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>Parser</Text>
          <View style={styles.langToggle}>
            <Pressable
              onPress={() => setParserLang("bm")}
              style={[
                styles.langButton,
                parserLang === "bm" && styles.langButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.langButtonText,
                  parserLang === "bm" && styles.langButtonTextActive,
                ]}
              >
                BM
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setParserLang("en")}
              style={[
                styles.langButton,
                parserLang === "en" && styles.langButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.langButtonText,
                  parserLang === "en" && styles.langButtonTextActive,
                ]}
              >
                EN
              </Text>
            </Pressable>
          </View>
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
          const isEditing = editingIndex === index;

          return (
            <View style={styles.listRow}>
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
            </View>
          );
        }}
      />

      <Button
        title={saving ? "Saving..." : "Save"}
        onPress={handleSave}
        disabled={saving || parsedIngredients.length === 0}
      />
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
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langLabel: {
    fontSize: 12,
    color: "#555",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  langToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  langButtonActive: {
    backgroundColor: "#111",
  },
  langButtonText: {
    color: "#111",
    fontWeight: "600",
  },
  langButtonTextActive: {
    color: "#fff",
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
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 16,
  },
});
