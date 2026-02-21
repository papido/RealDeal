import { createContext, PropsWithChildren, useContext } from "react";

interface DeliveryInfo {
  distance: number;
  fee: number;
  isWithinRange: boolean;
}

type CartType = {
  getLocation: () => Promise<null>;
  location: null;
  deliveryInfo: DeliveryInfo | null;
  locationLoading: boolean;
  locationError: string | null;
  calculateDeliveryForCurrentLocation: () => Promise<void>;
  calculateDeliveryFromAddress: (_address: string) => Promise<void>;
  clearDeliveryInfo: () => void;
};

export const CartContext = createContext<CartType>({
  getLocation: async () => null,
  location: null,
  deliveryInfo: null,
  locationLoading: false,
  locationError: null,
  calculateDeliveryForCurrentLocation: async () => {},
  calculateDeliveryFromAddress: async () => {},
  clearDeliveryInfo: () => {},
});

const CartProvider = ({ children }: PropsWithChildren) => {
  return (
    <CartContext.Provider
      value={{
        getLocation: async () => null,
        location: null,
        deliveryInfo: null,
        locationLoading: false,
        locationError: null,
        calculateDeliveryForCurrentLocation: async () => {},
        calculateDeliveryFromAddress: async () => {},
        clearDeliveryInfo: () => {},
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

export const useCart = () => useContext(CartContext);
