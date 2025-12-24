import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
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

  const handleFindRecipes = () => {
    const ingredientNames = ingredients.map((i) => i.name).join(",");
    router.push(`/(user)/menu?ingredients=${ingredientNames}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ingredients.length === 0 ? (
        <>
          <Text style={styles.emptyCartText}>Your cart is empty.</Text>
          <ExpandableInputs />
        </>
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

          <Button onPress={handleFindRecipes} style={styles.findRecipesButton}>
            <Text style={styles.findRecipesButtonText}>
              Find Recipes With These Ingredients
            </Text>
          </Button>

          {/* Delivery Scheduler */}
          <View style={styles.checkoutSection}>
            {/*<DeliveryScheduler
              onDateTimeChange={handleDateTimeChange}
              initialDate={selectedDateTime}
            /> */}

            {/* Delivery Pricing and Checkout */}
            <View style={styles.totalSection}>
              <ExpandableInputs />
              {/* <DeliveryPricing /> */}
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
    marginBottom: 10,
    color: "#666",
  },
  findRecipesButton: {
    marginVertical: 15,
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
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
  findRecipesButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
