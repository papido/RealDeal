import { createOrder } from "@/services/orderService";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import dayjs from "dayjs";
import { randomUUID } from "expo-crypto";
import * as Location from "expo-location";
import { router } from "expo-router";
import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Alert } from "react-native";
import {
  CartItem,
  OrderType,
  PaymentType,
  ProductItem,
  ProductType,
} from "../types";
import { useAuth } from "./authProvider";

// Location and delivery constants
const DELIVERY_RATE_PER_KM = 2.5; // RM 2.50 per km
const BASE_DELIVERY_FEE = 0.0; // RM 0.00 base fee
const MAX_DELIVERY_DISTANCE = 25; // km
const STORE_LOCATION = {
  latitude: 3.0738, // Replace with your store's coordinates
  longitude: 101.5183, // Klang, Selangor coordinates as example
};

interface DeliveryInfo {
  distance: number;
  fee: number;
  isWithinRange: boolean;
}

type CartType = {
  items: CartItem[];
  order: OrderType;
  addItem: (product: ProductType, item: CartItem["productItem"]) => void;
  updateQuantity: (itemId: string, amount: -1 | 1) => void;
  total: number;
  checkout: (deliveryDate: Date) => void;
  loading: boolean;
  submitPayment: (image: string) => void;
  payment: PaymentType | null;
  getLocation: () => Promise<Location.LocationObject>;
  location: Location.LocationObject | null;
  deliveryInfo: DeliveryInfo | null;
  locationLoading: boolean;
  locationError: string | null;
  calculateDeliveryForCurrentLocation: () => Promise<void>;
  calculateDeliveryFromAddress: (address: string) => Promise<void>;
  getTotalWithDelivery: () => number;
  cartItems: CartItem[]; // Added this to expose cart items
  clearDeliveryInfo: () => void; // Added this for better state management
};

export const CartContext = createContext<CartType>({
  items: [],
  order: {},
  addItem: () => {},
  updateQuantity: () => {},
  total: 0,
  checkout: () => {},
  submitPayment: () => {},
  loading: false,
  payment: null,
  getLocation: async () => {
    return {
      coords: {
        accuracy: 0,
        altitude: 0,
        altitudeAccuracy: null,
        heading: 0,
        latitude: 0,
        longitude: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    };
  },
  location: null,
  deliveryInfo: null,
  locationLoading: false,
  locationError: null,
  calculateDeliveryForCurrentLocation: async () => {},
  calculateDeliveryFromAddress: async () => {},
  getTotalWithDelivery: () => 0,
  cartItems: [],
  clearDeliveryInfo: () => {},
});

const CartProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<OrderType>({ id: "" });
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentType | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate delivery info from coordinates
  const calculateDeliveryInfo = (
    coords: Location.LocationObjectCoords
  ): DeliveryInfo => {
    // Validate coordinates before calculation
    if (
      !coords.latitude ||
      !coords.longitude ||
      coords.latitude === 0 ||
      coords.longitude === 0 ||
      Math.abs(coords.latitude) > 90 ||
      Math.abs(coords.longitude) > 180
    ) {
      throw new Error("Invalid coordinates provided");
    }

    const distance = calculateDistance(
      STORE_LOCATION.latitude,
      STORE_LOCATION.longitude,
      coords.latitude,
      coords.longitude
    );

    const isWithinRange = distance <= MAX_DELIVERY_DISTANCE;
    const fee = isWithinRange
      ? BASE_DELIVERY_FEE + distance * DELIVERY_RATE_PER_KM
      : 0;

    return { distance, fee, isWithinRange };
  };

  // Clear delivery info (useful when user changes location)
  const clearDeliveryInfo = () => {
    setDeliveryInfo(null);
    setLocation(null);
    setLocationError(null);
  };

  // Calculate delivery from address string
  const calculateDeliveryFromAddress = async (
    address: string
  ): Promise<void> => {
    if (!address || address.trim() === "") {
      setLocationError("Address is required");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      // Geocode the address to get coordinates
      const geocodeResult = await Location.geocodeAsync(address);

      if (geocodeResult.length === 0) {
        const errorMsg = "Could not find location for the provided address";
        setLocationError(errorMsg);
        throw new Error(errorMsg);
      }

      const coords = geocodeResult[0];
      const locationData: Location.LocationObject = {
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: null,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      };

      setLocation(locationData);

      const info = calculateDeliveryInfo(locationData.coords);
      setDeliveryInfo(info);
      setLocationError(null);

      console.log(
        `Delivery calculated: ${info.distance.toFixed(2)}km, RM${info.fee.toFixed(2)}`
      );

      if (!info.isWithinRange) {
        const message = `Sorry, we only deliver within ${MAX_DELIVERY_DISTANCE}km of our store. Your address is ${info.distance.toFixed(2)}km away.`;
        Alert.alert("Delivery Not Available", message);
        // Don't clear delivery info - let user see the distance
      }
    } catch (error) {
      console.error("Error calculating delivery from address:", error);
      setLocationError("Failed to calculate delivery from address");
      // Re-throw the error so calling code can handle it
      throw error;
    } finally {
      setLocationLoading(false);
    }
  };

  // Get user's current location and calculate delivery
  const calculateDeliveryForCurrentLocation = async (): Promise<void> => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const errorMsg = "Location permission denied";
        setLocationError(errorMsg);
        Alert.alert(
          "Permission Required",
          "Please allow location access to calculate delivery fees"
        );
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(locationData);

      const info = calculateDeliveryInfo(locationData.coords);
      setDeliveryInfo(info);
      setLocationError(null);

      if (!info.isWithinRange) {
        Alert.alert(
          "Delivery Not Available",
          `Sorry, we only deliver within ${MAX_DELIVERY_DISTANCE}km of our store. Your location is ${info.distance.toFixed(2)}km away.`
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError("Failed to get your location");
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const addItem = async (product: ProductType, productItem: ProductItem) => {
    const existingItem = items.find(
      (item) =>
        item.product.id === product.id &&
        item.productItem.name === productItem.name
    );

    if (existingItem) {
      updateQuantity(existingItem.id!, 1);
      return;
    }

    const newCartItem: CartItem = {
      id: randomUUID().split("-")[0],
      product,
      productItem,
      quantity: 1,
    };

    setItems([newCartItem, ...items]);

    // Calculate delivery info based on user's situation
    if (user && !deliveryInfo) {
      try {
        if (user.address) {
          // User has address, calculate delivery from address
          await calculateDeliveryFromAddress(user.address);
        } else {
          // User has no address, get current location
          await calculateDeliveryForCurrentLocation();
        }
      } catch (error) {
        console.log("Could not calculate delivery automatically:", error);
        // Don't block adding items if delivery calculation fails
      }
    }
  };

  const updateQuantity = (itemId: string, amount: -1 | 1) => {
    setItems(
      items
        .map((item) =>
          item.id !== itemId
            ? item
            : { ...item, quantity: item.quantity + amount }
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = items.reduce(
    (sum, item) => (sum += item.productItem.price * item.quantity),
    0
  );

  const getTotalWithDelivery = (): number => {
    if (!deliveryInfo?.isWithinRange) return total;
    return total + deliveryInfo.fee;
  };

  const checkout = async (deliveryDate: Date) => {
    const now = dayjs();
    const finalTotal = getTotalWithDelivery();

    const newOrder: OrderType = {
      id: randomUUID().split("-")[0],
      createdAt: now.toISOString(),
      total: finalTotal,
      uid: user?.uid!,
      status: "Pending",
      deliveryDateTime: dayjs(deliveryDate).format("dddd, MMM D YYYY • h:mm A"),
      orderItems: items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        productImage: item.product.images[0].uri,
        productItem: {
          id: item.productItem.id,
          name: item.productItem.name,
          price: item.productItem.price,
        },
        quantity: item.quantity,
      })),
    };
    setOrder(newOrder);
    setItems([]);
    // Clear delivery info after checkout
    clearDeliveryInfo();
    router.dismissTo("/(user)/menu");
    router.replace("/qrPayment");
  };

  const submitPayment = async (image: string) => {
    setLoading(true);

    try {
      let res = await createOrder(order);
      if (res.success) {
        console.log("Order successfully created", res);
      } else {
        Alert.alert("Order", res.msg);
        setLoading(false);
        return;
      }

      let downloadURL = "";
      if (image && image !== "") {
        try {
          // Convert image to blob
          const response = await fetch(image);
          const blob = await response.blob();

          // Create storage reference and upload
          const filename = `payment_proofs/${order.uid}_${Date.now()}.jpg`;
          const storageRef = storage().ref(filename);
          await storageRef.put(blob);

          // Get download URL
          downloadURL = await storageRef.getDownloadURL();
        } catch (error) {
          console.error("Image upload failed:", error);
          // Optionally handle fallback here or notify user
        }
      }

      // Create payment data and add to Firestore using the new API
      const paymentData: PaymentType = {
        imageUrl: downloadURL,
        timestamp: firestore.Timestamp.now(),
        uid: order.uid,
        amount: order.total,
        id: order.id,
      };

      await firestore().collection("payment_uploads").add(paymentData);

      setPayment(paymentData);
      setLoading(false);
      alert("Payment uploaded. Waiting for approval.");
    } catch (error) {
      console.error("Error submitting payment:", error);
      Alert.alert("Error", "Failed to submit payment. Please try again.");
      setLoading(false);
    }
  };

  const getLocation = async (): Promise<Location.LocationObject> => {
    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    return location;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        total,
        checkout,
        order,
        loading,
        submitPayment,
        payment,
        getLocation,
        location,
        deliveryInfo,
        locationLoading,
        locationError,
        calculateDeliveryForCurrentLocation,
        calculateDeliveryFromAddress,
        getTotalWithDelivery,
        cartItems: items, // Expose cart items
        clearDeliveryInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

export const useCart = () => useContext(CartContext);
