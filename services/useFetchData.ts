import { firestore } from "@/config/firebase";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

const useFetchData = <T extends FirebaseFirestoreTypes.DocumentData>(
  collectionName: string,
  buildQuery?: (
    ref: FirebaseFirestoreTypes.Query<T>
  ) => FirebaseFirestoreTypes.Query<T>
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionName) return;

    let ref: FirebaseFirestoreTypes.Query<T> = firestore().collection(
      collectionName
    ) as FirebaseFirestoreTypes.Query<T>;

    if (buildQuery) {
      ref = buildQuery(ref);
    }

    const unsubscribe = ref.onSnapshot(
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, buildQuery?.toString()]);

  return { data, loading, error };
};

export default useFetchData;
