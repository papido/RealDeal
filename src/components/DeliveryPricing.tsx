import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/authProvider";
import { useCart } from "../contexts/CartProvider";
import { useCurrency } from "../contexts/CurrencyProvider";

const DELIVERY_RATE_PER_KM = 2.5;

const DeliveryPricing = () => {
  const { deliveryInfo } = useCart();
  const { user } = useAuth();
  const { formatCurrency, currencySymbol } = useCurrency();

  const hasDeliveryInfo = !!deliveryInfo;
  const hasUserAddress = !!(user?.address && user.address.trim() !== "");
  const shouldShowDeliveryInfo = hasDeliveryInfo && deliveryInfo.isWithinRange;

  return (
    <>
      {shouldShowDeliveryInfo && (
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliverySourceText}>
            {hasUserAddress
              ? "From saved address"
              : "From current location"}
          </Text>
          <Text style={styles.deliveryText}>
            Distance: {deliveryInfo.distance.toFixed(2)} km
          </Text>
          <Text style={styles.deliveryText}>
            Distance charge: {formatCurrency(deliveryInfo.distance * DELIVERY_RATE_PER_KM)} (
            {deliveryInfo.distance.toFixed(2)} km x {currencySymbol}
            {DELIVERY_RATE_PER_KM.toFixed(2)})
          </Text>
          <Text style={styles.deliveryTotal}>
            Total delivery: {formatCurrency(deliveryInfo.fee)}
          </Text>
        </View>
      )}
    </>
  );
};

export default DeliveryPricing;

const styles = StyleSheet.create({
  deliveryInfo: {
    gap: 6,
  },
  deliverySourceText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 4,
  },
  deliveryText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  deliveryTotal: {
    textAlign: "right",
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#d0d0d0",
  },
});
