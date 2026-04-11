import { auth, firestore } from "@/config/firebase";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors } from "@/src/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Link, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function MenuStack() {
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [showCreditInfo, setShowCreditInfo] = useState(false);

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
    <>
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
            header: () => (
              <ScreenHeader
                title="Menu"
                right={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Link href="/(user)/menu/parseIng" asChild>
                      <Pressable style={{ marginRight: 12 }}>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Pressable
                            onPress={() => setShowCreditInfo(true)}
                            style={styles.creditPill}
                            accessibilityRole="button"
                            accessibilityLabel="Show AI credit usage"
                          >
                            <Text style={styles.creditPillText}>
                              AI credit: {aiCredits ?? 0}
                            </Text>
                          </Pressable>
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
                            style={{
                              marginRight: 15,
                              opacity: pressed ? 0.5 : 1,
                            }}
                          />
                        )}
                      </Pressable>
                    </Link>
                  </View>
                }
              />
            ),
          }}
        />
        <Stack.Screen
          name="parseIng"
          options={{
            title: "Parse Ingredients",
            headerBackTitle: "Menu",
          }}
        />
      </Stack>
      <Modal
        visible={showCreditInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreditInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>AI credit usage</Text>
            <Text style={styles.modalBody}>
              Conversions can use AI credits when units don't match. The exact
              cost depends on how many mismatches are found.
            </Text>
            <Text style={styles.modalBody}>Fix All uses a sliding cost:</Text>
            <Text style={styles.modalList}>1–10 mismatches: 3 credits</Text>
            <Text style={styles.modalList}>11–20 mismatches: 4 credits</Text>
            <Text style={styles.modalList}>21–40 mismatches: 6 credits</Text>
            <Text style={styles.modalList}>41+ mismatches: 7 credits</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCreditInfo(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  modalBody: {
    marginTop: 8,
    fontSize: 13,
    color: "#e2e8f0",
  },
  modalList: {
    marginTop: 6,
    fontSize: 13,
    color: "#e2e8f0",
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
