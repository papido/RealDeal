import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useCart } from "../contexts/CartProvider";
import { useAuth } from "../contexts/authProvider";

const DELIVERY_RATE_PER_KM = 2.5; // RM 2.50 per km
// const BASE_DELIVERY_FEE = 0.0; // RM 0.00 base fee
const MAX_DELIVERY_DISTANCE = 25; // km

const DeliveryPricing = () => {
  const { deliveryInfo } = useCart();

  const { user } = useAuth();

  // // Debug effect to log current state
  // useEffect(() => {
  //   console.log("=== DeliveryPricing Debug Info ===");
  //   console.log("User address:", user?.address);
  //   console.log("Has deliveryInfo:", !!deliveryInfo);
  //   console.log("DeliveryInfo:", deliveryInfo);
  //   console.log("Current location:", location);
  //   console.log("================================");
  // }, [user?.address, deliveryInfo, location]);

  // Always check if we need to calculate delivery
  const hasDeliveryInfo = !!deliveryInfo;
  const hasUserAddress = !!(user?.address && user.address.trim() !== "");

  // Show delivery info if it exists
  const shouldShowDeliveryInfo = hasDeliveryInfo && deliveryInfo.isWithinRange;

  return (
    <>
      {shouldShowDeliveryInfo && (
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliverySourceText}>
            {hasUserAddress
              ? "📍 From saved address"
              : "📍 From current location"}
          </Text>
          <Text style={styles.deliveryText}>
            Distance: {deliveryInfo.distance.toFixed(2)} km
          </Text>
          <Text style={styles.deliveryText}>
            Distance charge: RM
            {(deliveryInfo.distance * DELIVERY_RATE_PER_KM).toFixed(2)} (
            {deliveryInfo.distance.toFixed(2)} km × RM{DELIVERY_RATE_PER_KM})
          </Text>
          <Text style={styles.deliveryTotal}>
            Total delivery: RM{deliveryInfo.fee.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Pricing Section intentionally omitted (no product cart UI). */}
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
