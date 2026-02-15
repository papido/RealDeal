import { Timestamp } from "@react-native-firebase/firestore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { IngredientsType } from "../constants/types";
import { useCurrency } from "../contexts/CurrencyProvider";
import { convertWeightFromBase, Unit } from "../utils/invUnitConverter";
dayjs.extend(relativeTime);

type IngredientsListItemProps = {
  ingredientsItem: IngredientsType;
};

const IngredientsListItem = ({ ingredientsItem }: IngredientsListItemProps) => {
  const { formatCurrency } = useCurrency();
  const createdAt =
    ingredientsItem.createdAt instanceof Timestamp
      ? ingredientsItem.createdAt.toDate()
      : (ingredientsItem.createdAt ?? null);

  // Cast to any to access originalUnit if it's not in the type definition yet
  const item = ingredientsItem as any;
  let displayWeight = ingredientsItem.weight;
  let displayUnit = ingredientsItem.unit || "g";

  if (item.originalUnit) {
    displayWeight = convertWeightFromBase(
      ingredientsItem.weight,
      item.originalUnit as Unit
    );
    displayUnit = item.originalUnit;
  }

  // Format to remove trailing zeros (e.g., 2.00 -> 2) but keep decimals if needed
  const formattedWeight = Number(displayWeight.toFixed(2));

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {ingredientsItem.name}
        </Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.price}>{formatCurrency(Number(ingredientsItem.price || 0))}</Text>
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
          <Text style={styles.detailLabel}>Unit Weight</Text>
          <Text style={styles.detailValue}>
            {formattedWeight} {displayUnit}
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
