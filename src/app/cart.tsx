import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import DeliveryPricing from "../components/DeliveryPricing";
import ExpandableInputs from "../components/ExpandableInputs";
import IngredientsListItem from "../components/IngredientsListItem";
import { useIngredients } from "../contexts/IngredientsProvider";

const CartScreen = () => {
  const { ingredients } = useIngredients();

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
      {ingredients.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty.</Text>
      ) : (
        <>
          {/* All Cart Items */}
          <View style={styles.cartList}>
            {ingredients.map((item, index) => (
              <IngredientsListItem key={index} ingredientsItem={item} />
            ))}
          </View>

          {/* Delivery Scheduler */}
          <View style={styles.checkoutSection}>
            {/*<DeliveryScheduler
              onDateTimeChange={handleDateTimeChange}
              initialDate={selectedDateTime}
            /> */}

            {/* Delivery Pricing and Checkout */}
            <View style={styles.totalSection}>
              <ExpandableInputs />
              <DeliveryPricing />
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
  },
  emptyCartText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#666",
  },
  checkoutSection: {
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
