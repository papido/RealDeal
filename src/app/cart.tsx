import { useCart } from "@/src/providers/CartProvider";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import CartListItem from "../components/CartListItem";
import DeliveryPricing from "../components/DeliveryPricing";
import DeliveryScheduler from "../components/DeliveryScheduler";

const CartScreen = () => {
  const { items, checkout, loading } = useCart();

  const [selectedDateTime, setSelectedDateTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9:00 AM
    return tomorrow;
  });

  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {items.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty.</Text>
      ) : (
        <>
          {/* All Cart Items */}
          <View style={styles.cartList}>
            {items.map((item, index) => (
              <CartListItem key={index} cartItem={item} />
            ))}
          </View>

          {/* Delivery Scheduler */}
          <View style={styles.checkoutSection}>
            <DeliveryScheduler
              onDateTimeChange={handleDateTimeChange}
              initialDate={selectedDateTime}
            />

            {/* Delivery Pricing and Checkout */}
            <View style={styles.totalSection}>
              <DeliveryPricing />

              <Button
                onPress={() => checkout(selectedDateTime)}
                loading={loading}
                disabled={loading}
                style={styles.checkoutButton}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </Button>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default CartScreen;
const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  cartList: {
    gap: 10,
    marginBottom: 10,
  },
  emptyCartText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#666",
  },
  checkoutSection: {
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalSection: {
    marginTop: 5,
  },
  checkoutButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
