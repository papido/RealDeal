import { ScrollView, StyleSheet, Text, View } from "react-native";
import ExpandableInputs from "../components/ExpandableInputs";
import IngredientsListItem from "../components/IngredientsListItem";
import SwipeToDelete from "../components/SwipeToDelete";
import { useIngredients } from "../contexts/IngredientsProvider";
const CartScreen = () => {
  const { ingredients, removeIngredient } = useIngredients();

  // The `selectedDateTime` state and `handleDateTimeChange` function are not currently used.
  // I've removed them for now, but we can add them back when you implement the DeliveryScheduler.
  // const [selectedDateTime, setSelectedDateTime] = useState(() => {
  //   const tomorrow = new Date();
  //   tomorrow.setDate(tomorrow.getDate() + 2);
  //   tomorrow.setHours(9, 0, 0, 0); // Default to 9:00 AM
  //   return tomorrow;
  // });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {ingredients.length === 0 ? (
          <Text style={styles.emptyCartText}>Your cart is empty.</Text>
        ) : (
          <>
            {/* All Cart Items */}
            <View style={styles.cartList}>
              {ingredients.map((item) => (
                <SwipeToDelete
                  key={item.id}
                  onDelete={() => removeIngredient(item.id!)}
                >
                  <IngredientsListItem ingredientsItem={item} />
                </SwipeToDelete>
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
                {/* <DeliveryPricing /> */}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.floatingInputs}>
        <ExpandableInputs />
      </View>
    </View>
  );
};

export default CartScreen;
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  floatingInputs: {
    position: "absolute",
    right: 30,
    bottom: 80,
    alignItems: "center",
  },
  container: {
    padding: 10,
    paddingBottom: 420,
  },
  cartList: {
    // gap: 2,
  },
  emptyCartText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    marginBottom: 10,
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
