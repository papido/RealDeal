import { colors } from "@/src/constants/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StackActions } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#286511",
        tabBarInactiveTintColor: "#525252",
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: "#ccc",
          height: 80,
        },
      }}
    >
      <Tabs.Screen
        name="menu"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const focusedRoute = state.routes[state.index];
            const menuRoute = state.routes.find(
              (route) => route.name === "menu"
            );
            const menuStackKey = menuRoute?.state?.key;

            if (focusedRoute?.name === "menu" && menuStackKey) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: menuStackKey,
              });
            }
          },
        })}
        options={{
          title: "Menu",
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="cutlery" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="th-list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
