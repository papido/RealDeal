import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useCart } from "../providers/CartProvider";
import { useAuth } from "../providers/authProvider";
import Button from "./Button";

const DELIVERY_RATE_PER_KM = 2.5; // RM 2.50 per km
// const BASE_DELIVERY_FEE = 0.0; // RM 0.00 base fee
const MAX_DELIVERY_DISTANCE = 25; // km

const DeliveryPricing = () => {
  const {
    items,
    total,
    deliveryInfo,
    locationLoading,
    locationError,
    calculateDeliveryForCurrentLocation,
    calculateDeliveryFromAddress,
    getTotalWithDelivery,
    location,
    clearDeliveryInfo, // Make sure this is available from your updated CartProvider
  } = useCart();

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

  // Show location button if no delivery info exists
  const shouldShowLocationButton = !hasDeliveryInfo && !locationLoading;

  // Show delivery info if it exists
  const shouldShowDeliveryInfo = hasDeliveryInfo && deliveryInfo.isWithinRange;

  const handleCalculateDelivery = async () => {
    try {
      if (hasUserAddress) {
        console.log("Calculating delivery from user address:", user.address);
        await calculateDeliveryFromAddress(user?.address!);
      } else {
        console.log("No user address found, using current location");
        await calculateDeliveryForCurrentLocation();
      }
    } catch (error) {
      console.error("Error calculating delivery:", error);
    }
  };

  const handleClearDelivery = () => {
    console.log("Clearing delivery info");
    if (clearDeliveryInfo) {
      clearDeliveryInfo();
    }
  };

  return (
    <>
      {/* Debug Info (Remove this in production) */}
      {/* <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          User Address: {hasUserAddress ? "Set" : "Not Set"}
        </Text>
        <Text style={styles.debugText}>
          Address Value: {user?.address || "null"}
        </Text>
        <Text style={styles.debugText}>
          Has Delivery Info: {hasDeliveryInfo ? "Yes" : "No"}
        </Text>
        {deliveryInfo && (
          <Text style={styles.debugText}>
            Distance: {deliveryInfo.distance.toFixed(2)} km
          </Text>
        )}
        {hasDeliveryInfo && (
          <Button onPress={handleClearDelivery} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Delivery Info</Text>
          </Button>
        )}
      </View> */}

      {/* Location and Delivery Section */}
      <View style={styles.deliverySection}>
        {shouldShowLocationButton && (
          <Button
            onPress={handleCalculateDelivery}
            loading={locationLoading}
            style={styles.locationButton}
          >
            <Text style={styles.locationButtonText}>
              {locationLoading
                ? "Calculating..."
                : hasUserAddress
                  ? "Calculate Delivery Fee"
                  : "Get Location & Calculate Delivery"}
            </Text>
          </Button>
        )}

        {locationError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{locationError}</Text>
            <Button
              onPress={handleCalculateDelivery}
              loading={locationLoading}
              style={styles.retryButton}
            >
              <Text style={styles.locationButtonText}>Retry</Text>
            </Button>
          </View>
        )}

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

        {deliveryInfo && !deliveryInfo.isWithinRange && (
          <View style={styles.outOfRangeContainer}>
            <Text style={styles.outOfRangeText}>
              Delivery not available to your location (
              {deliveryInfo.distance.toFixed(2)} km away)
            </Text>
            <Text style={styles.outOfRangeSubtext}>
              We deliver within {MAX_DELIVERY_DISTANCE} km only
            </Text>
            <Text style={styles.deliverySourceText}>
              {hasUserAddress
                ? "Based on saved address"
                : "Based on current location"}
            </Text>
          </View>
        )}
      </View>

      {/* Pricing Section */}
      {items && items.length > 0 && (
        <View style={styles.pricingSection}>
          <Text style={styles.itemPrice}>
            Items: RM
            {items
              .reduce(
                (sum, item) => sum + item.productItem.price * item.quantity,
                0
              )
              .toFixed(2)}
          </Text>
          {/* Show delivery fee if delivery info exists */}
          {shouldShowDeliveryInfo && (
            <>
              <Text style={styles.deliveryPrice}>
                Delivery: RM{deliveryInfo.fee.toFixed(2)}
              </Text>
              <Text style={styles.totalPrice}>
                Total: RM{getTotalWithDelivery().toFixed(2)}
              </Text>
            </>
          )}

          {/* Show simple total if no delivery info yet */}
          {!hasDeliveryInfo && (
            <Text style={styles.totalPrice}>
              Subtotal: RM{total.toFixed(2)}
            </Text>
          )}

          {/* Show pickup only if delivery not available */}
          {deliveryInfo && !deliveryInfo.isWithinRange && (
            <Text style={styles.pickupOnlyText}>
              Pickup only - delivery not available
            </Text>
          )}
        </View>
      )}
    </>
  );
};

export default DeliveryPricing;

const styles = StyleSheet.create({
  debugSection: {
    padding: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b3d9ff",
    marginBottom: 12,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0066cc",
    marginBottom: 6,
  },
  debugText: {
    fontSize: 12,
    color: "#0066cc",
    marginBottom: 2,
  },
  clearButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  deliverySection: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  locationButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 0,
  },
  locationButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#fff5f5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fed7d7",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
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
  outOfRangeContainer: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  outOfRangeText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  outOfRangeSubtext: {
    color: "#856404",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  pricingSection: {
    padding: 16,
    marginTop: 12,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  itemPrice: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  deliveryPrice: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  totalPrice: {
    textAlign: "right",
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  pickupOnlyText: {
    fontSize: 14,
    color: "#856404",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
});
