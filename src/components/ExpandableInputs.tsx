import { createIngredients } from "@/src/services/ingredientsService";
import { convertIngredient, Unit } from "@/src/utils/invUnitConverter";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IngredientsType } from "../constants/types";
import Button from "./Button";

const translateToEnglish = async (text: string) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(
    text
  )}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return text;

    const data = await response.json();
    const translatedText =
      Array.isArray(data?.[0]) && data[0].length > 0
        ? data[0].map((item: any[]) => item?.[0]).join("")
        : "";

    return translatedText || text;
  } catch (error) {
    console.error("Translation failed", error);
    return text;
  }
};

const ExpandableInputs = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const { showActionSheetWithOptions } = useActionSheet();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["55%"], []);

  const [ingredients, setIngredients] = useState<IngredientsType>({
    name: "",
    price: "",
    quantity: "",
    weight: "",
    unit: "g",
    unitPrice: "",
  });

  const calculateUnitPrice = (
    price: string | number,
    weight: string | number,
    quantity: string | number
  ) => {
    const p = Number(price);
    const w = Number(weight);
    const q = Number(quantity);

    if (p > 0 && w > 0 && q > 0) {
      return (p / (w * q)).toFixed(2);
    }
  };

  const unitPrice = calculateUnitPrice(
    ingredients.price,
    ingredients.weight,
    ingredients.quantity
  );

  const onSelectUnit = () => {
    const options = [
      "g",
      "kg",
      "lb",
      "ml",
      "l",
      "oz",
      "fl oz",
      "qt",
      "pt",
      "gal",
      "each",
      "Cancel",
    ];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      { options, cancelButtonIndex, title: "Select a unit" },
      (selectedIndex?: number) => {
        if (
          selectedIndex !== undefined &&
          selectedIndex !== cancelButtonIndex
        ) {
          const selectedUnit = options[selectedIndex];
          setIngredients((prev) => ({
            ...prev,
            unit: selectedUnit,
            quantity:
              selectedUnit === "each"
                ? "1"
                : prev.unit === "each"
                  ? ""
                  : prev.quantity,
          }));
        }
      }
    );
  };

  const onSubmit = async () => {
    setErrors("");

    if (
      !ingredients.name.trim() ||
      Number(ingredients.price) <= 0 ||
      Number(ingredients.quantity) <= 0
    ) {
      setErrors("Please fill all the required fields!");
      return;
    }

    setLoading(true);

    const translatedName = await translateToEnglish(ingredients.name.trim());
    const quantity = Number(ingredients.quantity);
    const weight = Number(ingredients.weight);

    const { weight: convertedWeight, unit: convertedUnit } = convertIngredient(
      weight * quantity,
      ingredients.unit as Unit
    );

    const res = await createIngredients({
      name: translatedName,
      price: Number(ingredients.price),
      quantity: quantity,
      weight: convertedWeight,
      unit: convertedUnit,
      originalUnit: ingredients.unit,
      unitPrice: unitPrice,
    } as any);
    setLoading(false);

    if (res?.success) {
      Alert.alert("Success", "Ingredient created successfully!");
      setIngredients({
        name: "",
        price: "",
        quantity: "",
        weight: "",
        unit: "g",
        unitPrice: "",
      });
      sheetRef.current?.dismiss();
    } else {
      Alert.alert("Error", res?.msg || "Failed to create ingredient.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sheetRef.current?.present()}
      >
        <Text style={styles.symbol}>+</Text>
      </TouchableOpacity>

      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        enableOverDrag={false}
        backgroundStyle={styles.sheetBackground}
        handleStyle={styles.sheetHandle}
        handleIndicatorStyle={styles.sheetHandleIndicator}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.inputsContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            placeholder="Name"
            placeholderTextColor="#999"
            style={styles.input}
            value={ingredients.name}
            onChangeText={(text) =>
              setIngredients({ ...ingredients, name: text })
            }
          />
          <TextInput
            placeholder="Price"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="numeric"
            value={ingredients.price}
            onChangeText={(text) =>
              setIngredients({ ...ingredients, price: text })
            }
          />
          <View style={styles.weightContainer}>
            <TextInput
              placeholder={
                "Total Weight / Total individual count if\nthere's no weight (use each)"
              }
              placeholderTextColor="#999"
              multiline={true}
              style={[styles.input, styles.weightInput]}
              keyboardType="numeric"
              value={ingredients.weight}
              onChangeText={(text) =>
                setIngredients({ ...ingredients, weight: text })
              }
            />
            <TouchableOpacity style={styles.unitButton} onPress={onSelectUnit}>
              <Text style={styles.unitButtonText}>{ingredients.unit}</Text>
            </TouchableOpacity>
          </View>
          {unitPrice && (
            <Text
              style={styles.unitPrice}
            >{`$${unitPrice} / ${ingredients.unit}`}</Text>
          )}
          {ingredients.unit !== "each" && (
            <TextInput
              placeholder="Quantity"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="numeric"
              value={ingredients.quantity}
              onChangeText={(text) =>
                setIngredients({ ...ingredients, quantity: text })
              }
            />
          )}

          {!!errors && <Text style={styles.errorText}>{errors}</Text>}

          <Button
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            style={styles.updateButton}
          >
            <Text style={styles.checkoutButtonText}>Add Ingredient</Text>
          </Button>

          <TouchableOpacity
            style={[styles.button, styles.minusBtn]}
            onPress={() => sheetRef.current?.dismiss()}
          >
            <Text style={styles.symbol}>−</Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  button: {
    backgroundColor: "#007AFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  symbol: { fontSize: 28, color: "#fff", fontWeight: "bold" },
  inputsContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    width: "100%",
  },
  weightContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    gap: 8,
    marginVertical: 5,
  },
  weightInput: {
    flex: 1,
    marginVertical: 0, // Override vertical margin from .input
  },
  unitButton: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 60,
    alignItems: "center",
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  minusBtn: { backgroundColor: "#FF3B30" },
  updateButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: { color: "red", marginVertical: 5 },
  unitPrice: {
    width: "100%",
    textAlign: "right",
    color: "gray",
    fontSize: 12,
    marginBottom: 5,
  },
  sheetBackground: {
    backgroundColor: "#f0f0f0",
  },
  sheetHandle: {
    height: 40,
  },
  sheetHandleIndicator: {
    width: 50,
    height: 6,
  },
});

export default ExpandableInputs;
