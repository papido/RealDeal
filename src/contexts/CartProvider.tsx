import * as Location from "expo-location";
import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Alert } from "react-native";

// Location and delivery constants
const DELIVERY_RATE_PER_KM = 2.5;
const BASE_DELIVERY_FEE = 0.0;
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
  getLocation: () => Promise<Location.LocationObject>;
  location: Location.LocationObject | null;
  deliveryInfo: DeliveryInfo | null;
  locationLoading: boolean;
  locationError: string | null;
  calculateDeliveryForCurrentLocation: () => Promise<void>;
  calculateDeliveryFromAddress: (address: string) => Promise<void>;
  clearDeliveryInfo: () => void; // Added this for better state management
};

export const CartContext = createContext<CartType>({
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
  clearDeliveryInfo: () => {},
});

const CartProvider = ({ children }: PropsWithChildren) => {
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
        `Delivery calculated: ${info.distance.toFixed(2)}km, fee ${info.fee.toFixed(2)}`
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

  const getLocation = async (): Promise<Location.LocationObject> => {
    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    return location;
  };

  return (
    <CartContext.Provider
      value={{
        getLocation,
        location,
        deliveryInfo,
        locationLoading,
        locationError,
        calculateDeliveryForCurrentLocation,
        calculateDeliveryFromAddress,
        clearDeliveryInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

export const useCart = () => useContext(CartContext);
