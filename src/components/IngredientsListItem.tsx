import { Timestamp } from "@react-native-firebase/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { IngredientsType } from "../constants/types";
dayjs.extend(relativeTime);

type IngredientsListItemProps = {
  ingredientsItem: IngredientsType;
};

const IngredientsListItem = ({ ingredientsItem }: IngredientsListItemProps) => {
  const expiryDate =
    ingredientsItem.expiryDate instanceof Timestamp
      ? ingredientsItem.expiryDate.toDate()
      : (ingredientsItem.expiryDate ?? null);

  const createdAt =
    ingredientsItem.createdAt instanceof Timestamp
      ? ingredientsItem.createdAt.toDate()
      : (ingredientsItem.createdAt ?? null);

  const isExpired =
    expiryDate !== null && dayjs(expiryDate).isBefore(dayjs(), "day");

  return (
    <View style={styles.container}>
      {/* <Image
        source={{ uri: cartItem.product.images[0].uri || defaultPizzaImage }}
        style={styles.image}
        resizeMode="contain"
      /> */}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{ingredientsItem.name}</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.price}>RM{ingredientsItem.price.toFixed(2)}</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {expiryDate ? (
          <Text style={[styles.price, isExpired && styles.expiredText]}>
            Exp: {dayjs(expiryDate).format("DD MMM YYYY")}
          </Text>
        ) : (
          <Text style={styles.price}>No expiry date</Text>
        )}

        {createdAt && (
          <Text style={styles.time}>{dayjs(createdAt).fromNow()}</Text>
        )}
      </View>
      <View style={styles.quantitySelector}>
        <Text style={styles.quantity}>{ingredientsItem.quantity} grams</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 10,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
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
  expiredText: {
    color: "red",
    fontWeight: "bold",
  },
  time: {
    color: "gray",
  },
});

export default IngredientsListItem;
