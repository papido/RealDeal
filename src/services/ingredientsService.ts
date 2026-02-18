import { firestore } from "@/config/firebase";
import { IngredientsType, ResponseType } from "@/src/constants/types";
import { Timestamp } from "@react-native-firebase/firestore";

const getCartDocRef = (uid: string) =>
  firestore().collection("users").doc(uid).collection("cart").doc("current");

const normalizeCreatedAt = (value: any) =>
  value instanceof Timestamp ? value : Timestamp.fromDate(new Date());

const toSortedIngredients = (rawItems: any[]) =>
  rawItems
    .map((item) => ({
      ...item,
      createdAt: normalizeCreatedAt(item?.createdAt),
      expiryDate: item?.expiryDate
        ? item.expiryDate.toDate().toISOString().split("T")[0]
        : "",
    }))
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

export const getAllIngredients = (uid: string, onUpdate: any) => {
  if (!uid) return () => {};

  const unsubscribe = getCartDocRef(uid).onSnapshot(
    (snapshot) => {
      const data = snapshot.data();
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      onUpdate(toSortedIngredients(rawItems));
    },
    (error) => {
      console.error("Error fetching ingredients: ", error);
    },
  );

  return unsubscribe;
};

export const createIngredients = async (
  uid: string,
  ingredientsData: Partial<IngredientsType>,
): Promise<ResponseType> => {
  try {
    if (!uid) return { success: false, msg: "Missing user id." };

    const cartRef = getCartDocRef(uid);
    const ingredientsToSave: any = {
      ...ingredientsData,
      name: ingredientsData.name || "",
      price: ingredientsData.price || 0,
      weight: ingredientsData.weight || 0,
      unit: ingredientsData.unit || "",
      unitPrice: ingredientsData.unitPrice || 0,
      createdAt: ingredientsData.createdAt || Timestamp.fromDate(new Date()),
    };

    const ingredientId =
      ingredientsData?.id ?? firestore().collection("_tmpIngredientIds").doc().id;

    ingredientsToSave.id = ingredientId;
    ingredientsToSave.createdAt = normalizeCreatedAt(ingredientsToSave.createdAt);

    await firestore().runTransaction(async (transaction) => {
      const cartSnapshot = await transaction.get(cartRef);
      const data = cartSnapshot.data();
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const nextItems = [...rawItems];
      const existingIndex = nextItems.findIndex(
        (item: any) => item?.id === ingredientId,
      );

      if (existingIndex >= 0) {
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          ...ingredientsToSave,
        };
      } else {
        nextItems.push(ingredientsToSave);
      }

      transaction.set(
        cartRef,
        {
          items: nextItems,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          ...(cartSnapshot.exists
            ? {}
            : { createdAt: firestore.FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
    });

    return {
      success: true,
      data: { ...ingredientsToSave, id: ingredientId },
    };
  } catch (error: any) {
    console.log("error creating product: ", error);
    return { success: false, msg: error.message };
  }
};

export const deleteIngredient = async (uid: string, id: string) => {
  try {
    if (!uid) return;
    console.log("Attempting to delete Firestore ingredient ID:", id);

    const cartRef = getCartDocRef(uid);
    await firestore().runTransaction(async (transaction) => {
      const cartSnapshot = await transaction.get(cartRef);
      if (!cartSnapshot.exists) return;

      const data = cartSnapshot.data();
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const nextItems = rawItems.filter((item: any) => item?.id !== id);

      transaction.set(
        cartRef,
        {
          items: nextItems,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    console.log("Successfully deleted ingredient:", id);
  } catch (error) {
    console.error("Error deleting ingredient:", error);
  }
};

export const deleteAllIngredients = async (uid: string) => {
  try {
    if (!uid) return;

    await getCartDocRef(uid).set(
      {
        items: [],
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error deleting all ingredients:", error);
    throw error;
  }
};
