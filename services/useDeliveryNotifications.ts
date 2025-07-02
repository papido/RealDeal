import { firestore } from "@/config/firebase";
import { useState } from "react";

export interface DeliveryNotificationData {
  orderId: string;
  customerUid: string;
  orderDetails?: {
    items: string[];
    totalAmount: number;
    deliveryAddress: string;
  };
}

export const useDeliveryNotifications = () => {
  const [sending, setSending] = useState(false);

  // Get customer's push token from Firestore
  const getCustomerPushToken = async (
    customerUid: string
  ): Promise<string | null> => {
    try {
      const userDoc = await firestore()
        .collection("users")
        .doc(customerUid)
        .get();

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData?.expoPushToken || null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching customer push token:", error);
      return null;
    }
  };

  // FIXED: Send delivery notification with proper error handling
  const sendDeliveryNotification = async (data: DeliveryNotificationData) => {
    setSending(true);
    try {
      const customerToken = await getCustomerPushToken(data.customerUid);
      console.log("Customer push token:", customerToken);

      if (!customerToken) {
        console.log("Customer push token not found");
        return {
          success: false,
          error: "Customer does not have push notifications enabled",
        };
      }

      const response = await fetch(
        "https://us-central1-realdeal-f46e1.cloudfunctions.net/sendDeliveryNotification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pushToken: customerToken,
            orderId: data.orderId,
            title: "Order Delivered! 📦",
            body: `Great news! Your order #${data.orderId} has been successfully delivered. Thank you for your purchase!`,
            sound: "default",
            data: {
              type: "delivery",
              orderId: data.orderId,
              customerUid: data.customerUid,
              timestamp: new Date().toISOString(),
              orderDetails: data.orderDetails
                ? JSON.stringify(data.orderDetails)
                : undefined,
            },
          }),
        }
      );

      console.log("📡 API Response Status:", response.status);

      // FIXED: Properly handle successful response
      const result = await response.json();
      console.log("✅ Delivery notification sent successfully:", result);

      // Check if the notification was actually sent successfully
      if (result.success) {
        return { success: true, data: result };
      } else {
        console.error("❌ Notification failed despite 200 response:", result);
        return {
          success: false,
          error: result.error || "Notification failed to send",
        };
      }
    } catch (error) {
      console.error("❌ Error sending delivery notification:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      setSending(false);
    }
  };

  // FIXED: Batch notifications with proper error handling
  const sendBatchDeliveryNotifications = async (
    deliveries: DeliveryNotificationData[]
  ) => {
    setSending(true);
    try {
      const notifications = [];

      for (const delivery of deliveries) {
        const customerToken = await getCustomerPushToken(delivery.customerUid);

        if (customerToken) {
          notifications.push({
            pushToken: customerToken,
            orderId: delivery.orderId,
            title: "Order Delivered! 📦",
            body: `Great news! Your order #${delivery.orderId} has been successfully delivered. Thank you for your purchase!`,
            data: {
              type: "delivery",
              orderId: delivery.orderId,
              customerUid: delivery.customerUid,
              timestamp: new Date().toISOString(),
              orderDetails: delivery.orderDetails
                ? JSON.stringify(delivery.orderDetails)
                : undefined,
            },
          });
        }
      }

      if (notifications.length === 0) {
        return {
          success: false,
          error: "No customers have push notifications enabled",
        };
      }

      const response = await fetch(
        "https://us-central1-realdeal-f46e1.cloudfunctions.net/sendBatchDeliveryNotifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notifications,
          }),
        }
      );

      console.log("📡 Batch API Response Status:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: "Failed to parse error response" };
        }

        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      console.log("✅ Batch delivery notifications sent:", result);

      if (result.success) {
        return { success: true, data: result };
      } else {
        return {
          success: false,
          error: result.error || "Batch notifications failed",
        };
      }
    } catch (error) {
      console.error("❌ Error sending batch delivery notifications:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      setSending(false);
    }
  };

  // FIXED: Test notification with proper error handling
  const sendTestNotification = async (customerUid: string) => {
    setSending(true);
    try {
      const customerToken = await getCustomerPushToken(customerUid);
      console.log("🔍 Debug - Push token from Firestore:", customerToken);

      if (!customerToken) {
        return {
          success: false,
          error: "Customer does not have push notifications enabled",
        };
      }

      const response = await fetch(
        "https://us-central1-realdeal-f46e1.cloudfunctions.net/sendTestNotification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pushToken: customerToken,
            title: "Test Notification 🧪",
            body: "This is a test notification from your delivery app!",
          }),
        }
      );

      console.log("📡 API Response Status:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: "Failed to parse error response" };
        }

        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData.error || "Unknown error"}`
        );
      }

      const result = await response.json();
      console.log("📡 API Response Data:", result);

      // FIXED: Check if the response indicates success
      if (result.success) {
        console.log("✅ Test notification sent successfully!");
        return { success: true, data: result };
      } else {
        console.error("❌ Test notification failed:", result);
        return {
          success: false,
          error: result.error || "Test notification failed",
        };
      }
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      setSending(false);
    }
  };

  return {
    sendDeliveryNotification,
    sendBatchDeliveryNotifications,
    sendTestNotification,
    sending,
  };
};
