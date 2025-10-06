import { colors } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProductType } from "../constants/types";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

type ProductListItemProps = {
  recipe: ProductType;
};

export default function RecipeCard({ recipe }: ProductListItemProps) {
  const router = useRouter();
  const handleNavigate = () => {
    router.push(`/(user)/menu/${recipe.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleNavigate}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.images?.[0]?.uri }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.name}
        </Text>
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.footer}>
          {recipe.prepTime && (
            <View style={styles.timeContainer}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textLight}
              />
              <Text style={styles.timeText}>{recipe.prepTime} min</Text>
            </View>
          )}
          {recipe.portion && (
            <View style={styles.servingsContainer}>
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.textLight}
              />
              <Text style={styles.servingsText}>{recipe.portion}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: colors.card,
    borderRadius: 16,
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
    fontWeight: "700",
    color: colors.textLight,
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    color: colors.textLight,
    marginLeft: 4,
    fontWeight: "500",
  },
  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  servingsText: {
    fontSize: 11,
    color: colors.textLight,
    marginLeft: 4,
    fontWeight: "500",
  },
});
