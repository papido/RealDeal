import Button from "@/src/components/Button";
import { useCart } from "@/src/contexts/CartProvider";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const UploadPaymentScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const { submitPayment, order, loading } = useCart();
  const { showActionSheetWithOptions } = useActionSheet();
  const [buttonTrigger, setButtonTrigger] = useState(false);

  const openWhatsApp = () => {
    const phoneNumber = "+601163036269";
    const message = "This is my QR payment transfer.";
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          alert("Make sure WhatsApp is installed on your device");
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("An error occurred", err));

    setButtonTrigger(true);
  };

  const handleUpload = async () => {
    if (!buttonTrigger) {
      return showConfirmAlert();
    }
    await uploadImage();
  };

  const showConfirmAlert = () => {
    Alert.alert(
      "Send QR Receipt",
      "Have you sent the QR payment receipt on WhatsApp?",
      [
        { text: "No", onPress: () => openWhatsApp() },
        {
          text: "Yes",
          onPress: async () => {
            setButtonTrigger(true);
            await uploadImage(); // directly upload here
          },
        },
      ],
      { cancelable: true }
    );
  };

  const uploadImage = async () => {
    try {
      await submitPayment(image ?? "");
      setImage(null);
      router.replace("/(user)/orders");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  const handleSaveImage = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert(
        "Permission Required",
        "Cannot save image without permission."
      );
    }

    try {
      const fileUri = FileSystem.documentDirectory + "qr_image.jpg";
      const assetUri = Image.resolveAssetSource(
        require("@assets/images/exampleQR.jpeg")
      ).uri;

      const downloadResumable = FileSystem.createDownloadResumable(
        assetUri,
        fileUri
      );
      const downloadResult = await downloadResumable.downloadAsync();

      if (!downloadResult?.uri) {
        return Alert.alert("Error", "Failed to download image.");
      }

      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      Alert.alert("Success", "QR image saved to your gallery!");
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image.");
    }
  };

  const onLongPressQR = () => {
    showActionSheetWithOptions(
      {
        options: ["Save Image", "Cancel"],
        cancelButtonIndex: 1,
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) await handleSaveImage();
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* --- Order Info --- */}
        <Text style={styles.sectionTitle}>1.Order Summary🧾</Text>
        <Text style={styles.label}>Order ID: {order.id}</Text>
        <Text style={styles.label}>
          Delivery Time: {order.deliveryDateTime}
        </Text>

        {/* --- QR Section --- */}
        <Text style={styles.sectionTitle}>2.Scan QR to Pay📷 </Text>
        <Text style={styles.subText}>Long press to save image to gallery.</Text>

        <TouchableWithoutFeedback onLongPress={onLongPressQR}>
          <Image
            source={require("@assets/images/exampleQR.jpeg")}
            style={styles.image}
          />
        </TouchableWithoutFeedback>

        {/* --- Upload Section --- */}
        <Text style={styles.sectionTitle}>3.Upload Payment Proof📤 </Text>
        <Text style={styles.subText}>
          Scan the saved QR code using Maybank app{"\n"}and share to WhatsApp.
        </Text>

        <View style={styles.uploadRow}>
          <Button onPress={openWhatsApp} style={styles.whatsappButton}>
            <FontAwesome
              name="whatsapp"
              size={20}
              color="white"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.buttonText}>Send via WhatsApp</Text>
          </Button>
        </View>

        {/* --- Preview Picked Image --- */}
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}

        {/* --- Continue Button --- */}
        <Text style={styles.sectionTitle}>4.Press Continue Order Button👇🏼</Text>
        <Button
          style={styles.continueButton}
          onPress={handleUpload}
          loading={loading}
        >
          <Text style={styles.buttonText}>Continue Order →</Text>
        </Button>
      </View>
    </ScrollView>
  );
};

export default UploadPaymentScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 30,
  },
  container: {
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 10,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginVertical: 2,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginBottom: 10,
    borderRadius: 8,
  },
  previewImage: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 5,
  },
  imageButton: {
    backgroundColor: "brown",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  continueButton: {
    width: "60%",
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
  },
});
