import useFetchData from "@/services/useFetchData";
import ProductListItem from "@/src/components/ProductListItem";
import { colors } from "@/src/constants/theme";
import { useAuth } from "@/src/providers/authProvider";
import { ProductType } from "@/src/types";
import { router } from "expo-router";
import React from "react";
import { FlatList, Linking, StyleSheet, Text, View } from "react-native";

const MenuScreen = () => {
  const { user } = useAuth();

  const { data: products } = useFetchData<ProductType>("products", (ref) => {
    if (!user?.uid) return ref;
    return ref.where("uid", "==", user.uid).orderBy("createdAt", "desc");
  });

  return (
    <View style={styles.container}>
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.welcomeText}>Welcome, </Text>
          <Text style={styles.welcomeUsername}>{user?.username} 👋</Text>
        </View>
        <Text>
          Here you can find the best Halal dry ingredients for your meal.
        </Text>
      </View>

      {/* Product List */}
      {products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductListItem product={item} router={router} />
          )}
          numColumns={2}
          contentContainerStyle={{ gap: 10, padding: 10 }}
          columnWrapperStyle={{ gap: 10 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>😕 No meal kits found.</Text>
        </View>
      )}

      {/* Feedback Link */}
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>
          If you have any feedback, feel free to tell us{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://wa.me/601163036269")}
          >
            HERE
          </Text>
          .
        </Text>
      </View>
    </View>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  welcomeCard: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.secondaryLight,
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#444",
  },
  welcomeUsername: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackContainer: {
    padding: 16,
    alignItems: "center",
  },
  feedbackText: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
  link: {
    color: "green",
    fontWeight: "bold",
    textDecorationColor: "green",
    textDecorationLine: "underline",
  },
});
