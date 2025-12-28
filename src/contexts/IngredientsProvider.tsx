// src/contexts/IngredientsContext.tsx
import { IngredientsType } from "@/src/constants/types";
import {
  createIngredients,
  deleteIngredient,
  getAllIngredients,
} from "@/src/services/ingredientsService";
import React, { createContext, useContext, useEffect, useState } from "react";

type IngredientsContextType = {
  ingredients: IngredientsType[];
  addIngredient: (ingredient: IngredientsType) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
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

  // ✅ Real-time listener: subscribes to Firestore
  useEffect(() => {
    const unsubscribe = getAllIngredients((data: any) => {
      setIngredients(data);
    });

    // stop listening when unmounting
    return () => unsubscribe();
  }, []);

  const addIngredient = async (ingredient: IngredientsType) => {
    setLoading(true);
    await createIngredients(ingredient);
    setLoading(false);
  };

  const removeIngredient = async (id: string) => {
    setLoading(true);
    await deleteIngredient(id);
    setLoading(false);
  };

  return (
    <IngredientsContext.Provider
      value={{
        ingredients,
        addIngredient,
        removeIngredient,
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
