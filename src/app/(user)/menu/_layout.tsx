import { Stack } from "expo-router";
import React from "react";

export default function MenuStack() {
  return (
    <Stack screenOptions={{}}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="parseIng"
        options={{
          title: "Parse Ingredients",
          headerBackTitle: "Menu",
        }}
      />
    </Stack>
  );
}
