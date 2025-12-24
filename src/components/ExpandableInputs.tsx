import { createIngredients } from "@/src/services/ingredientsService";
import { convertIngredient, Unit } from "@/src/utils/unitConverter";
import { useActionSheet } from "@expo/react-native-action-sheet";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "./Button";

const ExpandableInputs = () => {
  const [showInputs, setShowInputs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const { showActionSheetWithOptions } = useActionSheet();

  const [ingredients, setIngredients] = useState({
    name: "",
    price: "",
    quantity: "",
    weight: "",
    unit: "g",
  });

  const onSelectUnit = () => {
    const options = ["g", "kg", "ml", "l", "oz", "gallon", "each", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      { options, cancelButtonIndex, title: "Select a unit" },
      (selectedIndex?: number) => {
        if (
          selectedIndex !== undefined &&
          selectedIndex !== cancelButtonIndex
        ) {
          setIngredients({ ...ingredients, unit: options[selectedIndex] });
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

    const { weight: convertedWeight, unit: convertedUnit } = convertIngredient(
      Number(ingredients.weight),
      ingredients.unit as Unit
    );

    const res = await createIngredients({
      name: ingredients.name.trim(),
      price: Number(ingredients.price),
      quantity: Number(ingredients.quantity),
      weight: convertedWeight,
      unit: convertedUnit,
    });
    setLoading(false);

    if (res?.success) {
      Alert.alert("Success", "Ingredient created successfully!");
      setIngredients({
        name: "",
        price: "",
        quantity: "",
        weight: "",
        unit: "g",
      });
      setShowInputs(false);
    } else {
      Alert.alert("Error", res?.msg || "Failed to create ingredient.");
    }
  };

  return (
    <View style={styles.container}>
      {!showInputs ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowInputs(true)}
        >
          <Text style={styles.symbol}>+</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputsContainer}>
          <TextInput
            placeholder="Name"
            style={styles.input}
            value={ingredients.name}
            onChangeText={(text) =>
              setIngredients({ ...ingredients, name: text })
            }
          />
          <TextInput
            placeholder="Price (RM)"
            style={styles.input}
            keyboardType="numeric"
            value={ingredients.price}
            onChangeText={(text) =>
              setIngredients({ ...ingredients, price: text })
            }
          />
          <TextInput
            placeholder="Quantity"
            style={styles.input}
            keyboardType="numeric"
            value={ingredients.quantity}
            onChangeText={(text) =>
              setIngredients({ ...ingredients, quantity: text })
            }
          />
          <View style={styles.weightContainer}>
            <TextInput
              placeholder="Weight"
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
            onPress={() => setShowInputs(false)}
          >
            <Text style={styles.symbol}>−</Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginTop: 10,
  },
  symbol: { fontSize: 28, color: "#fff", fontWeight: "bold" },
  inputsContainer: { width: "80%", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  minusBtn: { backgroundColor: "#FF3B30", marginTop: 10 },
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
});

export default ExpandableInputs;
