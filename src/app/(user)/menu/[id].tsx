import { useFetchIdProducts } from "@/services/useFetchIdProduct";
import Loading from "@/src/components/Loading";
import { colors } from "@/src/constants/theme";
import { useCart } from "@/src/providers/CartProvider";
import { ProductItem } from "@/src/types";
import Button from "@components/Button";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ProductDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const { addItem } = useCart();
  const router = useRouter();
  const { product, loading, fetchProduct } = useFetchIdProducts();
  const [selectedItem, setSelectedItem] = useState<ProductItem>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(id as string);
    }
  }, [id]);

  const addToCart = () => {
    if (!product || !selectedItem) {
      setShowError(true);
      return;
    }
    setShowError(false);
    addItem(product, selectedItem);
    router.push("/cart");
  };

  if (loading) return <Loading />;
  if (!product) return <Text>Product not found</Text>;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {product && <Stack.Screen options={{ title: product.name }} />}

      {/* Image grid */}
      <View style={styles.imageGrid}>
        {product.images.slice(0, 6).map((image, index) => (
          <Pressable key={index} onPress={() => setSelectedImage(image.uri)}>
            <Image source={{ uri: image.uri }} style={styles.image} />
          </Pressable>
        ))}
      </View>

      {/* Fullscreen image modal */}
      <Modal visible={!!selectedImage} transparent>
        <Pressable
          style={styles.modalBackground}
          onPress={() => setSelectedImage(null)}
        >
          <Image source={{ uri: selectedImage! }} style={styles.fullImage} />
        </Pressable>
      </Modal>

      {/* Product Info */}
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.prepTime}>{product.prepTime} minutes</Text>
      <Text style={styles.speciality}>{product.speciality}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.sectionTitle}>Ingredients:</Text>
      <Text style={styles.description}>{product.ingredients}</Text>

      {/* Item Selection */}
      <Text style={styles.sectionTitle}>Choose Portion:</Text>
      <View style={styles.items}>
        {product.items?.map((mapItem) => (
          <Pressable
            onPress={() => {
              setSelectedItem(mapItem);
              setShowError(false);
            }}
            key={mapItem.name}
            style={[
              styles.item,
              selectedItem === mapItem && styles.selectedItem,
            ]}
          >
            <Text
              style={[
                styles.itemText,
                selectedItem === mapItem && styles.selectedItemText,
              ]}
            >
              {mapItem.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: "auto" }}>
        {showError && (
          <Text style={styles.errorText}>Choose a portion first.</Text>
        )}
        {/* Price */}
        <Text style={styles.price}>
          RM {selectedItem ? selectedItem.price.toFixed(2) : product.price}
        </Text>

        {/* Add to Cart */}
        <Button onPress={addToCart} loading={loading} style={styles.button}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </Button>
      </View>
    </ScrollView>
  );
};

export default ProductDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 15,
    justifyContent: "flex-start",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 10,
    margin: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
  },
  prepTime: {
    fontSize: 16,
    color: "#888",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 5,
    lineHeight: 22,
  },
  speciality: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 8,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 10,
  },
  items: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 10,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: colors.secondaryLight,
  },
  itemText: {
    fontSize: 16,
    color: "#444",
  },
  selectedItemText: {
    fontWeight: "bold",
    color: "#000",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
  },
  button: {
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  errorText: {
    color: "red",
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "600",
  },
});
