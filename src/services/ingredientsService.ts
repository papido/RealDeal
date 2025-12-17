import { firestore } from "@/config/firebase";
import { IngredientsType, ResponseType } from "@/src/constants/types";
import { Timestamp } from "@react-native-firebase/firestore";

export const getAllIngredients = (onUpdate: any) => {
  // Listen to changes in real time
  const unsubscribe = firestore()
    .collection("ingredients")
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
  ingredientsData: Partial<IngredientsType>
): Promise<ResponseType> => {
  try {
    const ingredientsToSave: IngredientsType = {
      ...ingredientsData,
      name: ingredientsData.name || "",
      price: ingredientsData.price || 0,
      quantity: ingredientsData.quantity || 0,
      expiryDate: ingredientsData.expiryDate || null,
      createdAt: ingredientsData.createdAt || Timestamp.fromDate(new Date()),
    };

    const ingredientRef = ingredientsData?.id
      ? firestore().collection("ingredients").doc(ingredientsData.id)
      : firestore().collection("ingredients").doc(); // Auto-generated ID

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

const ingredientsCollection = firestore().collection("ingredients");

export const deleteIngredient = async (id: string) => {
  try {
    console.log("Attempting to delete Firestore ingredient ID:", id);
    await ingredientsCollection.doc(id).delete();
    console.log("Successfully deleted ingredient:", id);
  } catch (error) {
    console.error("Error deleting ingredient:", error);
  }
};
