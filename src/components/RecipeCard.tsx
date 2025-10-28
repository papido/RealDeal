import { colors } from "@/src/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

// The recipe prop is coming from TheMealDB API, which has a different shape
// than your internal ProductType. We'll treat it as `any` for now.
type RecipeCardProps = {
  recipe: any;
};

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const handleNavigate = () => {
    // TheMealDB uses `idMeal` for the recipe ID.
    router.push(`/(user)/menu/${recipe.idMeal}`);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleNavigate}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.strMealThumb }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.strMeal}
        </Text>
        {/* TheMealDB provides category and area, which we can display here */}
        <Text style={styles.description}>{recipe.strCategory}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 140,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.border,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 16,
  },
});
