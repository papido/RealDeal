import { createIngredients } from "@/src/services/ingredientsService";
import { CART_ITEMS_LIMIT } from "@/src/constants/limits";
import {
  convertIngredient,
  convertWeightFromBase,
  Unit,
} from "@/src/utils/invUnitConverter";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "../contexts/authProvider";
import { useCurrency } from "../contexts/CurrencyProvider";
import { useIngredients } from "../contexts/IngredientsProvider";

type ExpandableInputsProps = {
  editingIngredient?: IngredientsType | null;
  onEditingIngredientHandled?: () => void;
};

const ExpandableInputs = ({
  editingIngredient,
  onEditingIngredientHandled,
}: ExpandableInputsProps) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const { showActionSheetWithOptions } = useActionSheet();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["55%"], []);
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  const { ingredients: cartIngredients } = useIngredients();
  const uid = user?.uid ?? "";

  const [ingredients, setIngredients] = useState<IngredientsType>({
    name: "",
    price: "",
    weight: "",
    unit: "g",
    unitPrice: "",
  });

  useEffect(() => {
    if (!editingIngredient) return;

    const item = editingIngredient as any;
    const preferredUnit = item.originalUnit || editingIngredient.unit || "g";
    const displayWeight =
      item.originalUnit && Number(editingIngredient.weight) > 0
        ? convertWeightFromBase(
            Number(editingIngredient.weight),
            item.originalUnit as Unit,
          )
        : Number(editingIngredient.weight || 0);

    setErrors("");
    setIngredients({
      id: editingIngredient.id,
      name: editingIngredient.name ?? "",
      price: String(editingIngredient.price ?? ""),
      weight: String(displayWeight || ""),
      unit: preferredUnit,
      unitPrice: String(editingIngredient.unitPrice ?? ""),
      originalUnit: preferredUnit,
      originalQuantity: item.originalQuantity ?? 1,
      createdAt: editingIngredient.createdAt,
    });
    sheetRef.current?.present();
    onEditingIngredientHandled?.();
  }, [editingIngredient, onEditingIngredientHandled]);

  const calculateUnitPrice = (
    price: string | number,
    weight: string | number,
    unit: string,
  ) => {
    const p = Number(price);
    const w = Number(weight);

    if (p > 0 && w > 0) {
      const divisor = w;
      return (p / divisor).toFixed(2);
    }
  };

  const unitPrice = calculateUnitPrice(
    ingredients.price,
    ingredients.weight,
    ingredients.unit,
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
      "pint",
      "dozen",
      "quart",
      "gal",
      "piece",
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
          }));
        }
      },
    );
  };

  const onSubmit = async () => {
    setErrors("");

    if (
      !ingredients.name.trim() ||
      Number(ingredients.price) <= 0
    ) {
      setErrors("Please fill all the required fields!");
      return;
    }

    if (!uid) {
      Alert.alert("Sign in required", "Please sign in to save ingredients.");
      return;
    }
    const isEditingIngredient = Boolean(ingredients.id);
    if (!isEditingIngredient && cartIngredients.length >= CART_ITEMS_LIMIT) {
      Alert.alert(
        "Cart limit reached",
        `You can only save up to ${CART_ITEMS_LIMIT} cart ingredients.`,
      );
      return;
    }

    setLoading(true);

    const originalName = ingredients.name.trim();
    const weight = Number(ingredients.weight);
    const totalInput = weight;

    const { weight: convertedWeight, unit: convertedUnit } = convertIngredient(
      totalInput,
      ingredients.unit as Unit,
    );
    const convertedUnitPrice =
      convertedWeight > 0
        ? (Number(ingredients.price) / convertedWeight).toFixed(4)
        : "0";

    const res = await createIngredients(uid, {
      id: ingredients.id,
      name: originalName,
      price: Number(ingredients.price),
      weight: convertedWeight,
      unit: convertedUnit,
      originalUnit: ingredients.unit,
      originalQuantity: 1,
      unitPrice: convertedUnitPrice,
      createdAt: ingredients.createdAt,
    } as any);
    setLoading(false);

    if (res?.success) {
      Alert.alert(
        "Success",
        ingredients.id
          ? "Ingredient updated successfully!"
          : "Ingredient created successfully!",
      );
      setIngredients({
        name: "",
        price: "",
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
                "Total Weight / Total individual count if\nthere's no weight (use piece)"
              }
              placeholderTextColor="#999"
              multiline={true}
              style={[styles.input, styles.weightInput]}
              keyboardType="numeric"
              editable
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
            >{`${currencySymbol}${unitPrice} / ${ingredients.unit}`}</Text>
          )}

          {!!errors && <Text style={styles.errorText}>{errors}</Text>}

          <Button
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            style={styles.updateButton}
          >
            <Text style={styles.checkoutButtonText}>
              {ingredients.id ? "Update Ingredient" : "Add Ingredient"}
            </Text>
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
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    color: "#888",
  },
  weightContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "stretch",
    gap: 8,
    marginVertical: 5,
  },
  weightInput: {
    flex: 1,
    marginVertical: 0, // Override vertical margin from .input
  },
  unitButton: {
    paddingHorizontal: 10,
    paddingVertical: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 72,
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
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
