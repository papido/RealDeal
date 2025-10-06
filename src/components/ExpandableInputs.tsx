import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../providers/CartProvider";
import Button from "./Button";

const ExpandableInputs = () => {
  const [showInputs, setShowInputs] = useState(false);
  const { loading } = useCart();

  return (
    <View style={styles.container}>
      {!showInputs ? (
        // Plus button
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowInputs(true)}
        >
          <Text style={styles.symbol}>+</Text>
        </TouchableOpacity>
      ) : (
        // Show 4 text inputs + minus button
        <View style={styles.inputsContainer}>
          <TextInput placeholder={"Name"} style={styles.input} />
          <TextInput placeholder={"Price"} style={styles.input} />
          <TextInput placeholder={"Quantity"} style={styles.input} />
          <TextInput placeholder={"Expiry Date"} style={styles.input} />

          {/* Update ingredients button */}
          <Button
            onPress={() => setShowInputs(false)}
            loading={loading}
            disabled={loading}
            style={styles.updateButton}
          >
            <Text style={styles.checkoutButtonText}>Update Ingredients</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  symbol: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  inputsContainer: {
    width: "80%",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    width: "100%",
  },
  minusBtn: {
    backgroundColor: "#FF3B30", // red color for minus
  },
  updateButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ExpandableInputs;
