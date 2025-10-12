import CartProvider from "@/src/contexts/CartProvider";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { FontAwesome, SimpleLineIcons } from "@expo/vector-icons";
import "config/firebase.ts";
import * as Font from "expo-font";
import * as Notifications from "expo-notifications";
import { router, SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { AuthProvider, useAuth } from "../contexts/authProvider";
import { IngredientsProvider } from "../contexts/IngredientsProvider";
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
          options={{ title: "Cart", presentation: "modal" }}
        />
        <Stack.Screen
          name="qrPayment"
          options={{
            title: "Order Summary & Payment",
            presentation: "modal",
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: ({ tintColor }) => (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Are you sure?",
                    "Do you want to cancel the order?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Yes",
                        onPress: () => {
                          router.replace("/");
                        },
                        style: "destructive",
                      },
                    ],
                    { cancelable: true }
                  );
                }}
                style={{ marginRight: 15 }}
              >
                <FontAwesome
                  name="close"
                  size={24}
                  color={tintColor || "black"}
                />
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
      <CartProvider>
        <IngredientsProvider>
          <ActionSheetProvider>
            <SplashProvider>
              <AppLayout />
            </SplashProvider>
          </ActionSheetProvider>
        </IngredientsProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default RootLayout;
