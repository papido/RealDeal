import getAnnouncements from "@/services/getAnnouncements";
import Loading from "@/src/components/Loading";
import OrderListItem from "@/src/components/OrderListItem";
import { useAuth } from "@/src/providers/authProvider";
import { useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

const OrdersScreen = () => {
  const { user } = useAuth();
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
      <Text style={styles.text}>Breakfast</Text>
      {announcements.length > 0 ? (
        <View style={{ maxHeight: 500 }}>
          <FlatList
            data={announcements}
            renderItem={({ item }) => <OrderListItem order={item} />}
            keyExtractor={(item, index) => item.id ?? index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 10,
              borderColor: "gray",
            }}
            scrollEnabled={true}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.text}>No orders found</Text>
        </View>
      )}
      <Text style={styles.text}>Lunch</Text>
      {announcements.length > 0 ? (
        <View style={{ maxHeight: 500 }}>
          <FlatList
            data={announcements}
            renderItem={({ item }) => <OrderListItem order={item} />}
            keyExtractor={(item, index) => item.id ?? index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 10,
              borderColor: "gray",
            }}
            scrollEnabled={true}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.text}>No orders found</Text>
        </View>
      )}
      <Text style={styles.text}>Dinner</Text>
      {announcements.length > 0 ? (
        <View style={{ maxHeight: 500 }}>
          <FlatList
            data={announcements}
            renderItem={({ item }) => <OrderListItem order={item} />}
            keyExtractor={(item, index) => item.id ?? index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 10,
              borderColor: "gray",
            }}
            scrollEnabled={true}
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
    padding: 10,
    fontSize: 20,
    fontWeight: "bold",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
