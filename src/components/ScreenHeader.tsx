import { colors } from "@/src/constants/theme";
import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
};

const ScreenHeader = ({ title, left, right }: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
          {left ? <View style={styles.leftAction}>{left}</View> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
  },
  content: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  leftAction: {
    marginLeft: 8,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: colors.neutral900,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default ScreenHeader;
