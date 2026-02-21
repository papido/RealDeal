import { colors } from "@/src/constants/theme";
import { Stack } from "expo-router";
import React from "react";

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen
        name="privacy-policy"
        options={{ title: "Privacy Policy" }}
      />
    </Stack>
  );
}
