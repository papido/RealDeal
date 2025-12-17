import Loading from "@/src/components/Loading";
import { OrderType } from "@/src/constants/types";
import getAnnouncements from "@/src/services/getAnnouncements";
import dayjs from "dayjs";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import RenderHTML from "react-native-render-html";

const screenWidth = Dimensions.get("window").width;
const BASE_URL = "https://smile-uat.etiqa.com.my";

const OrdersDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [announcement, setAnnouncement] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAnnouncements();
      console.log("📢 Highlights fetched:", data);

      if (Array.isArray(data)) {
        const found = data.find((item) => item._id === id);
        setAnnouncement(found ?? null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;
  if (!announcement) return <Text>No highlight found</Text>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Highlight" }} />

      {/* 🖼️ Full-width image */}
      <Image
        source={{
          uri: announcement.image
            ? `${BASE_URL}${announcement.image}`
            : "https://placehold.co/600x400",
        }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={{ padding: 15 }}>
        <Text style={styles.title}>{announcement.title}</Text>
        <Text style={styles.date}>
          {dayjs(announcement.createdAt).format("DD MMM YYYY")}
        </Text>
        <RenderHTML
          contentWidth={screenWidth - 40}
          source={{ html: announcement.description || "<p>No description</p>" }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    width: screenWidth,
    height: 220,
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: "gray",
    marginBottom: 16,
  },
});

export default OrdersDetailsScreen;
