import { firestore } from "@/config/firebase";
import { OrderType } from "@/src/types";
import { useState } from "react";

export const useFetchIdOrders = () => {
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    const orderDoc = await firestore().collection("orders").doc(id).get();
    if (orderDoc.exists()) {
      setOrder({ id: orderDoc.id, ...orderDoc.data() } as OrderType);
    } else {
      console.log("No such document!(order)");
    }
    setLoading(false);
  };

  return { order, loading, fetchOrder };
};
