import { colors } from "@/src/constants/theme";
import { useDebounce } from "@/src/utils/useDebounce";
import RecipeCard from "@components/RecipeCard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MenuScreen = () => {
  const { ingredients: ingredientsFromCart } = useLocalSearchParams<{
    ingredients?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const performSearch = async (query: string) => {};

  useEffect(() => {
    const handleSearch = async () => {
      setLoading(true);
      try {
        // Prioritize ingredients from cart, otherwise use the search bar
        const query = ingredientsFromCart || debouncedSearchQuery;
        const results = performSearch(query);
        setRecipes(results);
      } catch (error) {
        console.error("Error searching:", error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    handleSearch();
  }, [debouncedSearchQuery, ingredientsFromCart]);

  return (
    <View style={styles.container}>
      {ingredientsFromCart && (
        <Text style={styles.infoText}>
          Showing recipes for: {ingredientsFromCart.replace(/,/g, ", ")}
        </Text>
      )}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, ingredients..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={recipes}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          keyExtractor={(item) => item.idMeal.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.recipesGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recipes found.</Text>
          }
        />
      )}
    </View>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  infoText: {
    paddingHorizontal: 16,
    paddingTop: 10,
    color: colors.textLight,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.textLight,
  },
  welcomeCard: {
    alignSelf: "flex-start",
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
  row: {
    justifyContent: "space-between",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },
  clearButton: {
    padding: 4,
  },
  recipesGrid: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
