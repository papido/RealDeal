import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { CartItem } from "../constants/types";
import { defaultPizzaImage } from "./ProductListItem";
dayjs.extend(relativeTime);

type CartListItemProps = {
  cartItem: CartItem;
};

const CartListItem = ({ cartItem }: CartListItemProps) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: cartItem.product.images[0].uri || defaultPizzaImage }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{cartItem.product.name}</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.price}>
            RM{cartItem.totalItem.price.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.price}>{cartItem.product.speciality}</Text>
        <Text style={styles.time}>
          {dayjs(cartItem.product.createdAt).fromNow()}
        </Text>
      </View>
      <View style={styles.quantitySelector}>
        <Text style={styles.quantity}>{cartItem.quantity} grams</Text>
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
    padding: 20,
  },
  quantity: {
    fontWeight: "500",
    fontSize: 18,
  },
  price: {
    color: colors.light.text,
    fontWeight: "bold",
  },
  time: {
    color: "gray",
  },
});

export default CartListItem;
