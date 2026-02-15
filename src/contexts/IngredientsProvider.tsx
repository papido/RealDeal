// src/contexts/IngredientsContext.tsx
import { IngredientsType } from "@/src/constants/types";
import {
  createIngredients,
  deleteAllIngredients,
  deleteIngredient,
  getAllIngredients,
} from "@/src/services/ingredientsService";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./authProvider";

type IngredientsContextType = {
  ingredients: IngredientsType[];
  addIngredient: (ingredient: IngredientsType) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
  clearIngredients: () => Promise<void>;
  loading: boolean;
};

const IngredientsContext = createContext<IngredientsContextType | null>(null);

export const IngredientsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [ingredients, setIngredients] = useState<IngredientsType[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const uid = user?.uid ?? "";

  // ✅ Real-time listener: subscribes to Firestore
  useEffect(() => {
    if (!uid) {
      setIngredients([]);
      return;
    }

    const unsubscribe = getAllIngredients(uid, (data: any) => {
      setIngredients(data);
    });

    // stop listening when unmounting
    return () => unsubscribe();
  }, [uid]);

  const addIngredient = async (ingredient: IngredientsType) => {
    if (!uid) return;
    setLoading(true);
    await createIngredients(uid, ingredient);
    setLoading(false);
  };

  const removeIngredient = async (id: string) => {
    if (!uid) return;
    setLoading(true);
    await deleteIngredient(uid, id);
    setLoading(false);
  };

  const clearIngredients = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      await deleteAllIngredients(uid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IngredientsContext.Provider
      value={{
        ingredients,
        addIngredient,
        removeIngredient,
        clearIngredients,
        loading,
      }}
    >
      {children}
    </IngredientsContext.Provider>
  );
};

export const useIngredients = () => {
  const context = useContext(IngredientsContext);
  if (!context) {
    throw new Error("useIngredients must be used inside IngredientsProvider");
  }
  return context;
};
