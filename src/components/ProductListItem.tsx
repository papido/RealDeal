import { colors } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Router } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ProductType } from "../constants/types";
import { useCurrency } from "../contexts/CurrencyProvider";

export const defaultPizzaImage =
  "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/food/default.png";

type ProductListItemProps = {
  product: ProductType;
  router: Router;
};

const ProductListItem = ({ product, router }: ProductListItemProps) => {
  const { formatCurrency } = useCurrency();
  const handleNavigate = () => {
    router.push(`/(user)/menu/${product.id}`);
  };

  return (
    <Pressable onPress={handleNavigate} style={styles.card}>
      <Image
        source={{ uri: product.images?.[0]?.uri || defaultPizzaImage }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.speciality}>{product.speciality}</Text>
        <Text style={styles.details}>
          Preparation Time: {product.prepTime} min
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(Number(product.price || 0))}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </View>
    </Pressable>
  );
};

export default ProductListItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    alignSelf: "center",
    width: "94%",
    marginHorizontal: 12,
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },
  speciality: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  details: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primaryLight,
  },
});
