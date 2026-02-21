import { Timestamp } from "@react-native-firebase/firestore";
import { ViewStyle } from "react-native";

export type ProductType = {
  id: string;
  prepTime?: string;
  images: ProductImageType[];
  name: string;
  description?: string;
  speciality?: string;
  ingredients?: string;
  price?: string;
  createdAt?: Date;
  portion?: string;
  items?: ProductItem[];
  uid?: string;
};

export type ProductItem = {
  id: string;
  name: string;
  price: number;
};

export type TotalItem = {
  price: number;
};

export type ProductImageType = {
  id: string;
  uri: string;
};

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

export type CartItem = {
  id?: string;
  product: ProductType;
  totalItem: TotalItem;
  quantity: number;
};

export const OrderStatusList: OrderStatus[] = [
  "Pending",
  "Paid",
  "Cooking",
  "Delivering",
  "Delivered",
];

export type OrderStatus =
  | "Pending"
  | "Paid"
  | "Cooking"
  | "Delivering"
  | "Delivered";

export type OrderType = {
  _id?: string;
  title?: string;
  description: string;
  image?: string;
  isDisabled?: boolean;
  startDateTime?: string;
  endDateTime?: string;
  lastUpdatedByPFNumber?: string;
  eventKeyword?: string;
  createdAt?: string;
  updatedAt?: string;
  signature?: string;
};

export type OrderItem = {
  id?: string;
  productName: ProductType["name"];
  productImage: ProductImageType["uri"];
  totalItem: TotalItem;
  quantity: number;
};

export type UserType = {
  uid?: string;
  email?: string;
  username: string;
  image?: any;
  address?: string;
  phoneNumber: string;
  currencySymbol?: string;
  aiCredits?: number;
} | null;

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export interface AuthContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; msg?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (uid: string) => Promise<UserType | null>;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  // signInWithPhoneNumber: () => Promise<void>;
  // confirmCode: () => Promise<void>;
  // confirm: FirebaseAuthTypes.ConfirmationResult | null;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  code: string;
  setCode: (code: string) => void;
}

export type PaymentType = {
  imageUrl?: string;
  timestamp?: Timestamp;
  uid?: string;
  amount?: number;
  id?: string;
};

export type IngredientsType = {
  id?: string;
  name: string;
  price: string;
  weight: string;
  unit: string;
  unitPrice: string;
  originalUnit?: string;
  originalQuantity?: number;
  createdAt?: Timestamp;
};

export type ParsedIngredient = {
  quantity?: number | string | null;
  unit?: string | null;
  ingredient?: string | null;
  resolvedQuantity?: number | null;
  resolvedUnit?: string | null;
  resolvedDensityEstimated?: boolean | null;
};

export interface Ingredient {
  density: number; // assume g/ml for solids (bulk density), and for liquids it doesn't matter since we return ml
  state: "liquid" | "solid";
  label: string;
}

export type IngredientsByCategory = Record<string, Record<string, Ingredient>>;
