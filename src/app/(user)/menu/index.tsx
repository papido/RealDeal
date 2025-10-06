import { MealAPI } from "@/services/mealAPI";
import useFetchData from "@/services/useFetchData";
import { colors } from "@/src/constants/theme";
import { ProductType } from "@/src/constants/types";
import { useDebounce } from "@/src/utils/useDebounce";
import RecipeCard from "@components/RecipeCard";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MenuScreen = () => {
  const { data: products } = useFetchData<ProductType>("products", (ref) => {
    return ref.orderBy("createdAt", "desc");
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const performSearch = async (query: any) => {
    // if no search query
    // if (!query.trim()) {
    //   const randomMeals = await MealAPI.getRandomMeals(12);
    //   return randomMeals
    //     .map((meal) => MealAPI.transformMealData(meal))
    //     .filter((meal) => meal !== null);
    // }

    // search by name first, then by ingredient if no results
    const nameResults = await MealAPI.searchMealsByName(query);
    let results = nameResults;

    // if (results.length === 0) {
    //   const ingredientResults = await MealAPI.filterByIngredient(query);
    //   results = ingredientResults;
    // }

    return results;
    //   .slice(0, 12)
    //   .map((meal: any) => MealAPI.transformMealData(meal))
    //   .filter((meal: any) => meal !== null);
  };

  useEffect(() => {
    const handleSearch = async () => {
      setLoading(true);
      try {
        const results = await performSearch(debouncedSearchQuery);
        setRecipes(results);
      } catch (error) {
        console.error("Error searching:", error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    handleSearch();
  }, [debouncedSearchQuery]);

  return (
    <View style={styles.container}>
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

      <FlatList
        data={products}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        keyExtractor={(item) => item.id!.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.recipesGrid}
        showsVerticalScrollIndicator={false}
      />
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
