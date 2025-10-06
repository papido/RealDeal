import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { OrderType } from "../constants/types";

dayjs.extend(relativeTime);

type OrderListItemProps = {
  order: OrderType;
};
const BASE_URL = "https://smile-uat.etiqa.com.my";

const OrderListItem = ({ order }: OrderListItemProps) => {
  const { width } = useWindowDimensions();

  return (
    <Link href={`/orders/${order._id}`} asChild>
      <Pressable style={styles.container}>
        <View style={{ width: 370 }}>
          <Image
            source={{
              uri: order.image
                ? `${BASE_URL}${order.image}`
                : "https://via.placeholder.com/100",
            }}
            style={styles.image}
            contentFit="cover"
          />
          <Text style={styles.id}>ID: {order._id}</Text>

          <View style={styles.headerRow}>
            <Text style={styles.time}>{order.title}</Text>
            <Text style={styles.dateTime}>
              {dayjs(order.createdAt).fromNow()}
            </Text>
          </View>

          <RenderHTML contentWidth={250} source={{ html: order.description }} />
        </View>
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // Android shadow
  },
  id: {
    fontWeight: "bold",
    color: "gray",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    color: "black",
    fontWeight: "bold",
    flexShrink: 1,
  },
  dateTime: {
    fontWeight: "500",
    maxWidth: 120,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default OrderListItem;
