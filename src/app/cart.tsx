import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ExpandableInputs from "../components/ExpandableInputs";
import IngredientsListItem from "../components/IngredientsListItem";
import SwipeToDelete from "../components/SwipeToDelete";
import { IngredientsType } from "../constants/types";
import { useCurrency } from "../contexts/CurrencyProvider";
import { useIngredients } from "../contexts/IngredientsProvider";
const CartScreen = () => {
  const { ingredients, removeIngredient } = useIngredients();
  const { formatCurrency } = useCurrency();
  const [editingIngredient, setEditingIngredient] =
    useState<IngredientsType | null>(null);
  const totalPrice = ingredients.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0,
  );

  return (
    <BottomSheetModalProvider>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container}>
          {ingredients.length === 0 ? (
            <Text style={styles.emptyCartText}>Your cart is empty.</Text>
          ) : (
            <>
              {/* All Cart Items */}
              <View style={styles.cartList}>
                {ingredients.map((item, index) => (
                  <View
                    key={item.id}
                    style={
                      Platform.OS === "ios" && index === 0
                        ? styles.firstCartItem
                        : null
                    }
                  >
                    <SwipeToDelete
                      onDelete={() => removeIngredient(item.id!)}
                    >
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onLongPress={() =>
                          setEditingIngredient({ ...(item as IngredientsType) })
                        }
                        delayLongPress={300}
                      >
                        <IngredientsListItem ingredientsItem={item} />
                      </TouchableOpacity>
                    </SwipeToDelete>
                  </View>
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
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(totalPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.floatingInputs}>
          <ExpandableInputs
            editingIngredient={editingIngredient}
            onEditingIngredientHandled={() => setEditingIngredient(null)}
          />
        </View>
      </View>
    </BottomSheetModalProvider>
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
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 420,
  },
  cartList: {
    paddingTop: 4,
  },
  firstCartItem: {
    marginTop: 18,
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
  totalRow: {
    marginTop: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
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
