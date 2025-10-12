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
        <View>
          <Image
            source={{
              uri: order.image
                ? `${BASE_URL}${order.image}`
                : "https://via.placeholder.com/100",
            }}
            style={styles.image}
            contentFit="cover"
          />

          <Text style={styles.title}>{order.title}</Text>
        </View>
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 4,
    width: 200,
    height: 150,
  },
  id: {
    fontWeight: "bold",
    color: "gray",
  },

  title: {
    color: "black",
    paddingTop: 3,
  },
  dateTime: {
    fontWeight: "500",
    maxWidth: 120,
  },
  image: {
    width: 200,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default OrderListItem;
