import { colors } from "@/src/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Link, Stack } from "expo-router";
import { Pressable, View } from "react-native";

export default function MenuStack() {
  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Link href="/(user)/menu/parseIng" asChild>
              <Pressable style={{ marginRight: 15 }}>
                <FontAwesome6
                  name="magnifying-glass"
                  size={22}
                  color={colors.neutral900}
                />
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

        headerStyle: {
          backgroundColor: colors.primary,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Menu" }} />
      <Stack.Screen name="parseIng" options={{ title: "Parse Ingredients" }} />
    </Stack>
  );
}
