import { useDeliveryNotifications } from "@/services/useDeliveryNotifications";
import { Text } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../providers/authProvider";

const TestPushNotification = () => {
  const { user } = useAuth();
  const { sendTestNotification } = useDeliveryNotifications();

  const handleTest = async () => {
    if (!user?.uid) {
      console.log("❌ No user logged in");
      return;
    }

    console.log("🧪 Testing push notification for user:", user.uid);
    const result = await sendTestNotification(user.uid);
    console.log("🧪 Test result:", result);

    if (result.success) {
      alert("Test notification sent! Check your device.");
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  return (
    <Button onPress={handleTest}>
      <Text style={{ color: "white" }}>Test Push Notification</Text>
    </Button>
  );
};

export default TestPushNotification;
