import { firestore } from "@/config/firebase";
import { IngredientsType, ResponseType } from "@/src/constants/types";
import { Timestamp } from "@react-native-firebase/firestore";

const getIngredientsCollection = (uid: string) =>
  firestore().collection("users").doc(uid).collection("ingredients");

export const getAllIngredients = (uid: string, onUpdate: any) => {
  if (!uid) return () => {};
  // Listen to changes in real time
  const unsubscribe = getIngredientsCollection(uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const ingredients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          expiryDate: doc.data().expiryDate
            ? doc.data().expiryDate.toDate().toISOString().split("T")[0]
            : // string format: YYYY-MM-DD
              "",
        }));
        onUpdate(ingredients);
      },
      (error) => {
        console.error("Error fetching ingredients: ", error);
      }
    );

  return unsubscribe;
};

export const createIngredients = async (
  uid: string,
  ingredientsData: Partial<IngredientsType>
): Promise<ResponseType> => {
  try {
    if (!uid) return { success: false, msg: "Missing user id." };
    const ingredientsToSave: any = {
      ...ingredientsData,
      name: ingredientsData.name || "",
      price: ingredientsData.price || 0,
      weight: ingredientsData.weight || 0,
      unit: ingredientsData.unit || "",
      unitPrice: ingredientsData.unitPrice || 0,
      createdAt: ingredientsData.createdAt || Timestamp.fromDate(new Date()),
    };

    const collection = getIngredientsCollection(uid);
    const ingredientRef = ingredientsData?.id
      ? collection.doc(ingredientsData.id)
      : collection.doc(); // Auto-generated ID

    // 🔧 Add id to the data before saving
    ingredientsToSave.id = ingredientRef.id;

    await ingredientRef.set(ingredientsToSave, { merge: true });

    return {
      success: true,
      data: { ...ingredientsToSave, id: ingredientRef.id },
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
    await getIngredientsCollection(uid).doc(id).delete();
    console.log("Successfully deleted ingredient:", id);
  } catch (error) {
    console.error("Error deleting ingredient:", error);
  }
};

export const deleteAllIngredients = async (uid: string) => {
  try {
    if (!uid) return;
    const snapshot = await getIngredientsCollection(uid).get();
    if (snapshot.empty) return;

    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting all ingredients:", error);
    throw error;
  }
};
