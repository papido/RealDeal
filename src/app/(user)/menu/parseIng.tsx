import { parseBMLine } from "@/src/utils/bmParser";
import { parseENLine } from "@/src/utils/enParser";
import React, { JSX, useMemo, useState } from "react";
import {
  Button,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type ParsedIngredient = {
  quantity?: string | null;
  unit?: string | null;
  ingredient?: string | null;
};

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

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          height: 120,
          marginBottom: 12,
          textAlignVertical: "top",
        }}
        multiline
        placeholder="Paste ingredients here…"
        value={rawText}
        onChangeText={setRawText}
      />

      <View
        style={{
          flexDirection: "row",
          marginBottom: 12,
          justifyContent: "space-between",
        }}
      >
        <Button title="Parse" onPress={handleParse} />
        <View style={{ width: 12 }} />
        <Button
          title="Clear"
          onPress={() => {
            setRawText("");
            setParsedIngredients([]);
            setEditingIndex(null);
            setDraftIngredient("");
          }}
        />
        <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
          <Pressable
            onPress={() => setParserLang("bm")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: parserLang === "bm" ? "#111" : "#ccc",
              backgroundColor: parserLang === "bm" ? "#111" : "transparent",
            }}
          >
            <Text style={{ color: parserLang === "bm" ? "#fff" : "#111" }}>
              BM
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setParserLang("en")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: parserLang === "en" ? "#111" : "#ccc",
              backgroundColor: parserLang === "en" ? "#111" : "transparent",
            }}
          >
            <Text style={{ color: parserLang === "en" ? "#fff" : "#111" }}>
              EN
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList<ParsedIngredient>
        data={parsedIngredients}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => {
          const isEditing = editingIndex === index;

          return (
            <View
              style={{
                flexDirection: "row",
                marginBottom: 8,
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text style={{ width: 60 }}>{item.quantity ?? "?"}</Text>
              <Text style={{ width: 60 }}>{item.unit ?? "?"}</Text>

              {isEditing ? (
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                  value={draftIngredient}
                  onChangeText={setDraftIngredient}
                  placeholder="Ingredient"
                  autoFocus
                  onSubmitEditing={doneEdit}
                  returnKeyType="done"
                />
              ) : (
                <Text style={{ flex: 1 }}>{item.ingredient ?? "?"}</Text>
              )}

              {isEditing ? (
                <Pressable onPress={doneEdit}>
                  <Text style={{ color: "blue" }}>Done</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => startEdit(index)}>
                  <Text style={{ color: "blue" }}>✏️</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />

      <Button
        title="Save"
        onPress={() => {
          const cleanIngredients = parsedIngredients.map(
            ({ quantity, unit, ingredient }) => ({
              quantity,
              unit,
              ingredient,
            })
          );
          console.log("Saved parsed ingredients", cleanIngredients);
        }}
      />
    </View>
  );
}
