import { firestore } from "@/config/firebase"; // ✅ Use this
import { createIngredients } from "@/src/services/ingredientsService";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [ingredients, setIngredients] = useState({
    name: "",
    price: "",
    quantity: "",
    expiryDate: null as Date | null,
  });

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setIngredients((prev) => ({ ...prev, expiryDate: selectedDate }));
    }
    setShowDatePicker(false);
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

    // ✅ Fix: Correct timestamp creation
    const formattedExpiry = ingredients.expiryDate
      ? firestore.Timestamp.fromDate(ingredients.expiryDate)
      : null;

    setLoading(true);
    const res = await createIngredients({
      name: ingredients.name.trim(),
      price: Number(ingredients.price),
      quantity: Number(ingredients.quantity),
      expiryDate: formattedExpiry,
    });
    setLoading(false);

    if (res?.success) {
      Alert.alert("Success", "Ingredient created successfully!");
      setIngredients({ name: "", price: "", quantity: "", expiryDate: null });
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
            placeholder="Price"
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

          {/* ✅ Clean date picker UX */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, { justifyContent: "center" }]}
          >
            <Text>
              {ingredients.expiryDate
                ? ingredients.expiryDate.toDateString()
                : "Select Expiry Date (optional)"}
            </Text>
          </TouchableOpacity>

          {/* ✅ Use a modal so picker doesn’t show at the bottom */}
          <Modal
            transparent
            visible={showDatePicker}
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.datePickerBox}>
                <DateTimePicker
                  value={ingredients.expiryDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={onChangeDate}
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  datePickerBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneText: { color: "white", fontWeight: "600" },
});

export default ExpandableInputs;
