import { firestore } from "@/config/firebase";
import { OrderType, ResponseType } from "@/src/types";
import dayjs from "dayjs";

export const createOrder = async (
  orderData: Partial<OrderType>
): Promise<ResponseType> => {
  try {
    const now = dayjs();

    // ✅ Prepare the order object
    const orderToSave: OrderType = {
      ...orderData,
      id: orderData.id || "",
      createdAt: orderData.createdAt || now.toISOString(),
      total: orderData.total || 0,
      uid: orderData.uid || "",
      status: orderData.status || "Pending",
      orderItems: orderData.orderItems || [],
    };

    const orderRef = orderData?.id
      ? firestore().collection("orders").doc(orderData.id)
      : firestore().collection("orders").doc(); // auto-generated ID

    // 🔧 Add id to the data before saving
    orderToSave.id = orderRef.id;

    await orderRef.set(orderToSave, { merge: true });

    return { success: true, data: { ...orderToSave, id: orderRef.id } };
  } catch (error: any) {
    console.log("error creating product: ", error);
    return { success: false, msg: error.message };
  }
};

export const updateOrder = async (
  orderData: Partial<OrderType>
): Promise<ResponseType> => {
  try {
    const now = dayjs();

    // ✅ Prepare the order object
    const orderToSave: OrderType = {
      ...orderData,
      id: orderData.id || "",
      createdAt: orderData.createdAt || now.toISOString(),
      total: orderData.total || 0,
      uid: orderData.uid || "",
      status: orderData.status || "Pending",
      orderItems: orderData.orderItems || [],
    };

    const orderRef = orderData?.id
      ? firestore().collection("orders").doc(orderData.id)
      : firestore().collection("orders").doc(); // auto-generated ID

    // 🔧 Ensure the ID is set before saving
    orderToSave.id = orderRef.id;

    await orderRef.set(orderToSave, { merge: true });

    return { success: true, data: { ...orderToSave, id: orderRef.id } };
  } catch (error: any) {
    console.log("error updating order: ", error);
    return { success: false, msg: error.message };
  }
};
