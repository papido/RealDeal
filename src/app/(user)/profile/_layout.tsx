import ScreenHeader from "@/src/components/ScreenHeader";
import { colors } from "@/src/constants/theme";
import { Stack } from "expo-router";
import React from "react";

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "left",
        headerStyle: {
          backgroundColor: colors.primary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: () => <ScreenHeader title="Profile" />,
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{ title: "Privacy Policy" }}
      />
    </Stack>
  );
}
