import Loading from "@/src/components/Loading";
import OrderListItem from "@/src/components/OrderListItem";
import getAnnouncements from "@/src/services/getAnnouncements";
import { useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

const OrdersScreen = () => {
  // const { user } = useAuth();
  // const { data: orders, loading } = useFetchData<OrderType>("orders", (ref) =>
  //   ref.where("uid", "==", user?.uid).orderBy("createdAt", "desc")
  // );
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAnnouncements();
      console.log("📢 Announcements fetched:", data);
      setAnnouncements(data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>
        Highlights <Text style={{ color: "gray" }}>{">"}</Text>{" "}
      </Text>
      {announcements.length > 0 ? (
        <View style={{ maxHeight: 500 }}>
          <FlatList
            data={announcements}
            renderItem={({ item }) => <OrderListItem order={item} />}
            keyExtractor={(item, index) => item.id ?? index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
            contentContainerStyle={{
              paddingLeft: 5, // 👈 space before the first item
              paddingRight: 5, // optional end padding
            }}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.text}>No orders found</Text>
        </View>
      )}
      <Text style={styles.text}>
        Lunch <Text style={{ color: "gray" }}>{">"}</Text>{" "}
      </Text>
      {announcements.length > 0 ? (
        <View style={{ maxHeight: 500 }}>
          <FlatList
            data={announcements}
            renderItem={({ item }) => <OrderListItem order={item} />}
            keyExtractor={(item, index) => item.id ?? index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
            contentContainerStyle={{
              paddingLeft: 5, // 👈 space before the first item
              paddingRight: 5, // optional end padding
            }}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.text}>No orders found</Text>
        </View>
      )}
      <Text style={styles.text}>
        Dinner <Text style={{ color: "gray" }}>{">"}</Text>{" "}
      </Text>
      {announcements.length > 0 ? (
        <View style={{ maxHeight: 500 }}>
          <FlatList
            data={announcements}
            renderItem={({ item }) => <OrderListItem order={item} />}
            keyExtractor={(item, index) => item.id ?? index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
            contentContainerStyle={{
              paddingLeft: 5, // 👈 space before the first item
              paddingRight: 5, // optional end padding
            }}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.text}>No orders found</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  text: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "bold",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
