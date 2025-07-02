import { Timestamp } from "@react-native-firebase/firestore";
import * as Notifications from "expo-notifications";
import { ViewStyle } from "react-native";

export type ProductType = {
  id?: string;
  prepTime?: string;
  images: ProductImageType[];
  name: string;
  description?: string;
  speciality?: string;
  ingredients?: string;
  price?: string;
  createdAt?: Date;
  items?: ProductItem[];
  uid?: string;
};

export type ProductItem = {
  id: string;
  name: string;
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

export type PizzaSize = "S" | "M" | "L" | "XL";

export type CartItem = {
  id?: string;
  product: ProductType;
  productItem: ProductItem;
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
  id?: string;
  createdAt?: string;
  total?: number;
  uid?: string;
  status?: OrderStatus;
  deliveryDateTime?: string;

  orderItems?: OrderItem[];
};

export type OrderItem = {
  id?: string;
  productName: ProductType["name"];
  productImage: ProductImageType["uri"];
  productItem: ProductItem;
  quantity: number;
};

export type UserType = {
  uid?: string;
  email?: string;
  username: string;
  image?: any;
  address?: string;
  phoneNumber: string;
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
  updateUserData: (uid: string) => Promise<UserType | null>;
  expoPushToken?: string | null;
  notification?: Notifications.Notification | null;
  error?: Error | null;
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
