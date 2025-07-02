import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

const ProductItemForm = () => {
  // Ensure product.items is always an array
  const [product, setProduct] = useState({
    items: [{ id: Date.now().toString(), name: "", price: 0 }],
  });

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(), // Unique ID
      name: "",
      price: 0,
    };
    setProduct((prev) => ({
      ...prev,
      items: [...(prev.items ?? []), newItem],
    }));
  };

  return (
    <View>
      <Text style={styles.label}>Items</Text>

      {(product.items ?? []).map((item, index) => (
        <View key={item.id} style={{ marginBottom: 12 }}>
          <TextInput
            value={item.name}
            onChangeText={(value) => {
              const updatedItems = [...product.items];
              updatedItems[index] = { ...item, name: value };
              setProduct({ ...product, items: updatedItems });
            }}
            placeholder="Item name"
            style={styles.input}
          />
          <TextInput
            value={item.price.toString()}
            onChangeText={(value) => {
              const updatedItems = [...product.items];
              updatedItems[index] = {
                ...item,
                price: Number(value),
              };
              setProduct({ ...product, items: updatedItems });
            }}
            placeholder="Price"
            style={styles.input}
            keyboardType="numeric"
          />
        </View>
      ))}

      <Button title="Add Item" onPress={handleAddItem} />
    </View>
  );
};
export default ProductItemForm;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 10,
  },
  input: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 20,
  },
  label: {
    color: "gray",
    fontSize: 16,
  },
});
