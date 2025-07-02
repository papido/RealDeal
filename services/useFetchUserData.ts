import { firestore } from "@/config/firebase";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

const useFetchUserData = <T extends FirebaseFirestoreTypes.DocumentData>(
  collectionName: string,
  docId: string
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionName || !docId) return;

    const ref = firestore().collection(collectionName).doc(docId);

    const unsubscribe = ref.onSnapshot(
      (doc) => {
        if (doc.exists()) {
          setData({ ...(doc.data() as object), id: doc.id } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
};

export default useFetchUserData;
