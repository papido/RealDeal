import CartProvider from "@/src/contexts/CartProvider";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { FontAwesome, SimpleLineIcons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import "config/firebase.ts";
import * as Font from "expo-font";
import * as Notifications from "expo-notifications";
import { router, SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import {
  GestureHandlerRootView,
  Pressable,
} from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../contexts/authProvider";
import {
  IngredientsProvider,
  useIngredients,
} from "../contexts/IngredientsProvider";
import { SplashProvider } from "../contexts/SplashProvider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

//Prevent splash screen from hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a separate component that uses useAuth
const AppLayout = () => {
  const { user } = useAuth(); // Now this is within AuthProvider
  const isLoggedIn = !!user;
  const { ingredients, removeIngredient } = useIngredients();

  const handleFindRecipes = () => {
    const ingredientNames = ingredients.map((i) => i.name).join(",");
    if (router.canDismiss()) {
      router.dismiss();
    }
    router.push(`/(user)/menu?ingredients=${ingredientNames}`);
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
            title: "Cart",
            presentation: "modal",
            headerRight: () => (
              <Pressable
                onPress={handleFindRecipes}
                style={styles.findRecipesButton}
              >
                <Text style={styles.findRecipesButtonText}>
                  Find Recipes With These Ingredients
                </Text>
              </Pressable>
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
            <CartProvider>
              <IngredientsProvider>
                <SplashProvider>
                  <AppLayout />
                </SplashProvider>
              </IngredientsProvider>
            </CartProvider>
          </BottomSheetModalProvider>
        </ActionSheetProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  findRecipesButton: {
    marginVertical: 10,
    backgroundColor: "#28a745",
    padding: 5,
    borderRadius: 8,
  },
  findRecipesButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
