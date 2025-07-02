// services/getPaymentByOrderId.ts
import { PaymentType } from "@/src/types";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "@react-native-firebase/firestore";

export const getPaymentByOrderId = async (
  orderId: string
): Promise<PaymentType | null> => {
  const db = getFirestore();
  const q = query(
    collection(db, "payment_uploads"),
    where("id", "==", orderId)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return doc.data() as PaymentType;
  }

  return null;
};
