import CartProvider from "@/src/contexts/CartProvider";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { FontAwesome, SimpleLineIcons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Font from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";
import { AuthProvider, useAuth } from "../contexts/authProvider";
import { CurrencyProvider } from "../contexts/CurrencyProvider";
import {
  IngredientsProvider,
  useIngredients,
} from "../contexts/IngredientsProvider";
import { SplashProvider } from "../contexts/SplashProvider";

//Prevent splash screen from hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a separate component that uses useAuth
const AppLayout = () => {
  const { user } = useAuth(); // Now this is within AuthProvider
  const { ingredients, clearIngredients, loading } = useIngredients();
  const isLoggedIn = !!user;
  const canDeleteAll = ingredients.length > 0 && !loading;

  const handleDeleteAllIngredients = () => {
    if (!canDeleteAll) return;
    Alert.alert(
      "Delete all ingredients?",
      "This will remove every ingredient from your cart.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await clearIngredients();
          },
        },
      ],
    );
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(user)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen
          name="cart"
          options={{
            title: `Cart (${ingredients.length})`,
            presentation: "modal",
            headerRight: () => (
              <TouchableOpacity
                onPress={handleDeleteAllIngredients}
                disabled={!canDeleteAll}
                style={{ opacity: canDeleteAll ? 1 : 0.5, marginRight: 8 }}
              >
                <Text style={{ color: "#d32f2f", fontWeight: "600" }}>
                  {loading ? "Deleting..." : "Delete All"}
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </>
  );
};

const RootLayout = () => {
  const [loaded] = Font.useFonts({
    SpaceMono: require("@assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
    ...SimpleLineIcons.font,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }

    mobileAds().initialize();

    // Suppress specific console warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes?.("React Native Firebase namespaced API")) {
        return;
      }
      originalWarn(...args);
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ActionSheetProvider>
          <BottomSheetModalProvider>
            <CurrencyProvider>
              <CartProvider>
                <IngredientsProvider>
                  <SplashProvider>
                    <AppLayout />
                  </SplashProvider>
                </IngredientsProvider>
              </CartProvider>
            </CurrencyProvider>
          </BottomSheetModalProvider>
        </ActionSheetProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
};

export default RootLayout;
