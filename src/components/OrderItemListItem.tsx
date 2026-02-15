import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { OrderItem } from "../constants/types";
import { useCurrency } from "../contexts/CurrencyProvider";
import { defaultPizzaImage } from "./ProductListItem";

type OrderItemListItemProps = {
  item: OrderItem;
};

const OrderItemListItem = ({ item }: OrderItemListItemProps) => {
  const { formatCurrency } = useCurrency();
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.productImage || defaultPizzaImage }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.title}>{item.productName}</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.price}>{formatCurrency(item.totalItem.price)}</Text>
        </View>
      </View>
      <View style={styles.quantitySelector}>
        <Text style={styles.quantity}>{item.quantity}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 5,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 75,
    aspectRatio: 1,
    alignSelf: "center",
    marginRight: 10,
    marginLeft: 10,
  },
  title: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 5,
  },
  subtitleContainer: {
    flexDirection: "row",
    gap: 5,
  },
  quantitySelector: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginVertical: 10,
    marginRight: 20,
  },
  quantity: {
    fontWeight: "500",
    fontSize: 18,
  },
  price: {
    color: colors.light.tint,
    fontWeight: "bold",
  },
});

export default OrderItemListItem;
