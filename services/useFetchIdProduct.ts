import { firestore } from "@/config/firebase";
import { ProductType } from "@/src/types";
import { useState } from "react";

export const useFetchIdProducts = () => {
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async (id: string) => {
    setLoading(true);
    const productDoc = await firestore().collection("products").doc(id).get();
    if (productDoc.exists()) {
      setProduct({ id: productDoc.id, ...productDoc.data() } as ProductType);
    } else {
      console.log("No such document!(product)");
    }
    setLoading(false);
  };

  return { product, loading, fetchProduct };
};
