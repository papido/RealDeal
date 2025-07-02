import useFetchData from "@/services/useFetchData";
import Loading from "@/src/components/Loading";
import OrderListItem from "@/src/components/OrderListItem";
import { useAuth } from "@/src/providers/authProvider";
import { OrderType } from "@/src/types";
import { FlatList, StyleSheet, Text, View } from "react-native";

const OrdersScreen = () => {
  const { user } = useAuth();
  const { data: orders, loading } = useFetchData<OrderType>("orders", (ref) =>
    ref.where("uid", "==", user?.uid).orderBy("createdAt", "desc")
  );

  if (loading) return <Loading />;
  return (
    <View style={styles.container}>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={({ item }) => <OrderListItem order={item} />}
          contentContainerStyle={{ gap: 10, padding: 10, borderColor: "gray" }}
        />
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.text}>No orders found</Text>
        </View>
      )}
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    backgroundColor: "white",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
