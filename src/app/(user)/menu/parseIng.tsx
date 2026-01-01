import { parseLine } from "@/src/utils/parsers";
import React, { useState } from "react";
import {
  Button,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function IngredientParser() {
  const [rawText, setRawText] = useState("");
  const [parsedIngredients, setParsedIngredients] = useState([]);

  const handleParse = () => {
    const lines = rawText.split("\n").filter((l) => l.trim());
    setParsedIngredients(lines.map(parseLine));
  };

  const editIngredient = (index, field, value) => {
    const updated = [...parsedIngredients];
    updated[index][field] = value;
    setParsedIngredients(updated);
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
        }}
        multiline
        placeholder="Paste ingredients here…"
        value={rawText}
        onChangeText={setRawText}
      />

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <Button title="Parse" onPress={handleParse} />
        <View style={{ width: 12 }} />
        <Button title="Clear" onPress={() => setRawText("")} />
      </View>

      <FlatList
        data={parsedIngredients}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View
            style={{
              flexDirection: "row",
              marginBottom: 8,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text>{item.quantity || "?"}</Text>
            <Text>{item.unit || "?"}</Text>
            <Text>{item.ingredient || "?"}</Text>
            <Pressable
              onPress={() => {
                const newIngredient = prompt(
                  "Edit ingredient",
                  item.ingredient
                );
                if (newIngredient)
                  editIngredient(index, "ingredient", newIngredient);
              }}
            >
              <Text style={{ color: "blue" }}>✏️</Text>
            </Pressable>
          </View>
        )}
      />

      <Button
        title="Save"
        onPress={() =>
          console.log("Saved parsed ingredients", parsedIngredients)
        }
      />
    </View>
  );
}
