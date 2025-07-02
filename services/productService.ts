import { firestore } from "@/config/firebase";
import { ProductType, ResponseType } from "@/src/types";
import uuid from "react-native-uuid";
import { uploadFileToCloudinary } from "./imageService";
export const defaultPizzaImage =
  "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/food/default.png";

export const createProduct = async (
  productData: Partial<ProductType>
): Promise<ResponseType> => {
  try {
    const uploadedImages: string[] = [];

    // ✅ Upload each image in the array
    for (const image of productData.images || []) {
      const uploadResponse = await uploadFileToCloudinary(
        { uri: image.uri },
        "products"
      );

      if (!uploadResponse.success) {
        return {
          success: false,
          msg: uploadResponse.msg || `Failed to upload image`,
        };
      }
      uploadedImages.push(uploadResponse.data);
    }

    // ✅ Prepare the final product object
    const productToSave: ProductType = {
      ...productData,
      images:
        uploadedImages.length > 0
          ? uploadedImages.map((uri) => ({ id: uuid.v4(), uri }))
          : [{ id: uuid.v4(), uri: defaultPizzaImage }],
      name: productData.name || "",
      price: productData.price || "RM7-RM18",
      prepTime: productData.prepTime || "",
      description: productData.description || "",
      ingredients: productData.ingredients || "",
      speciality: productData.speciality || "",
      createdAt: productData.createdAt || new Date(),
      items: productData.items || [],
    };

    const productRef = productData?.id
      ? firestore().collection("products").doc(productData.id)
      : firestore().collection("products").doc(); // Auto-generated ID

    // 🔧 Add id to the data before saving
    productToSave.id = productRef.id;

    await productRef.set(productToSave, { merge: true });

    return { success: true, data: { ...productToSave, id: productRef.id } };
  } catch (error: any) {
    console.log("error creating product: ", error);
    return { success: false, msg: error.message };
  }
};

export const updateProduct = async (
  productId: string,
  updatedData: Partial<ProductType>
): Promise<ResponseType> => {
  try {
    const uploadedImages: string[] = [];

    // ✅ Upload new images (if any)
    for (const image of updatedData.images || []) {
      const uploadResponse = await uploadFileToCloudinary(
        { uri: image.uri },
        "products"
      );

      if (!uploadResponse.success) {
        return {
          success: false,
          msg: uploadResponse.msg || `Failed to upload image`,
        };
      }

      uploadedImages.push(uploadResponse.data);
    }

    // ✅ Build final update object
    const productToUpdate: Partial<ProductType> = {
      ...updatedData,
      ...(uploadedImages.length > 0 && {
        images: uploadedImages.map((uri) => ({ id: uuid.v4(), uri })),
      }),
    };

    const productRef = firestore().collection("products").doc(productId);
    await productRef.set(productToUpdate, { merge: true });

    return { success: true, data: { ...productToUpdate, id: productId } };
  } catch (error: any) {
    console.log("error updating product: ", error);
    return { success: false, msg: error.message };
  }
};

export const deleteProduct = async (
  productId: string
): Promise<ResponseType> => {
  try {
    const productRef = firestore().collection("products").doc(productId);
    await productRef.delete();
    return { success: true, msg: "Product deleted successfully" };
  } catch (err: any) {
    console.log("error deleting product: ", err);
    return { success: false, msg: err.message };
  }
};
