import { useAuth } from "@/src/contexts/authProvider";
import { useSplash } from "@/src/contexts/SplashProvider";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

export default function Index() {
  const { user } = useAuth();
  const { splashShown, setSplashShown } = useSplash();
  const [showSplash, setShowSplash] = useState(!splashShown);

  useEffect(() => {
    if (!splashShown) {
      const timer = setTimeout(() => {
        setSplashShown(true);
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (showSplash) {
    return (
      <View style={styles.container}>
        <Image
          source={require("@assets/images/splashImage.png")}
          style={styles.splashImage}
          resizeMode="cover"
        />
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator size="large" color="#194BFB" />
        </View>
      </View>
    );
  }

  return <Redirect href={user ? "/(user)/menu" : "/(auth)/sign-in"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  splashImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  spinnerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 100,
  },
});
