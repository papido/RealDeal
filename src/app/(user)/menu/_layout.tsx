import { auth, firestore } from "@/config/firebase";
import { colors } from "@/src/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Link, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function MenuStack() {
  const [aiCredits, setAiCredits] = useState<number | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      if (!user) {
        setAiCredits(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = undefined;
        }
        return;
      }

      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeProfile = firestore()
        .collection("users")
        .doc(user.uid)
        .onSnapshot(
          (doc) => {
            const data = doc.data() as { aiCredits?: number } | undefined;
            const value =
              typeof data?.aiCredits === "number" ? data.aiCredits : null;
            setAiCredits(value);
          },
          () => setAiCredits(null),
        );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Menu",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Link href="/(user)/menu/parseIng" asChild>
                <Pressable style={{ marginRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.creditPill}>
                      <Text style={styles.creditPillText}>
                        AI credit: {aiCredits ?? 0}
                      </Text>
                    </View>
                    <FontAwesome6
                      name="magnifying-glass"
                      size={22}
                      color={colors.neutral900}
                    />
                  </View>
                </Pressable>
              </Link>
              <Link href="/cart" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome6
                      name="add"
                      size={25}
                      color={colors.neutral900}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      <Stack.Screen name="parseIng" options={{ title: "Parse Ingredients" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  creditPill: {
    marginRight: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#8b5e34",
  },
  creditPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
});
