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
  const createdAt =
    ingredientsItem.createdAt instanceof Timestamp
      ? ingredientsItem.createdAt.toDate()
      : (ingredientsItem.createdAt ?? null);

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {ingredientsItem.name}
        </Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.price}>RM{ingredientsItem.price.toFixed(2)}</Text>
          {createdAt && (
            <Text style={styles.time}>
              {" "}
              · Added {dayjs(createdAt).fromNow()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Qty</Text>
          <Text style={styles.detailValue}>{ingredientsItem.quantity}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Unit Weight</Text>
          <Text style={styles.detailValue}>
            {ingredientsItem.weight}{" "}
            {ingredientsItem.unit || "g" /* Fallback for old data */}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    color: colors.light.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  time: {
    color: "gray",
    fontSize: 12,
    marginLeft: 5,
  },
  detailsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  detailItem: {
    alignItems: "center",
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailValue: {
    fontWeight: "500",
    fontSize: 16,
    color: "#333",
  },
});

export default IngredientsListItem;
