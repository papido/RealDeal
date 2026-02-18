import Icon from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
};

const SWIPE_THRESHOLD = -100;

const SwipeToDelete = ({ children, onDelete }: Props) => {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(-200, { duration: 200 });
        runOnJS(onDelete)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: withTiming(translateX.value < 0 ? 1 : 0.3),
  }));

  return (
    <View style={styles.wrapper}>
      {/* Background delete layer */}
      <Animated.View style={[styles.deleteBackground, deleteButtonStyle]}>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Icon name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Foreground swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

export default SwipeToDelete;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  deleteBackground: {
    backgroundColor: "#ff3b30",
    position: "absolute",
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  deleteButton: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  deleteText: {
    color: "white",
    fontWeight: "600",
    marginTop: 2,
  },
});
