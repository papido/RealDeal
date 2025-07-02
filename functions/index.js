const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Expo Push Endpoint
const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Send single delivery notification
exports.sendDeliveryNotification = functions.https.onRequest(
  async (req, res) => {
    const { pushToken, title, body, data } = req.body;

    if (!pushToken || !title || !body) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const response = await axios.post(EXPO_ENDPOINT, {
        to: pushToken,
        title,
        priority: "high",
        body,
        data,
        sound: "default",
      });

      return res.status(200).json({ success: true, response: response.data });
    } catch (error) {
      console.error("Expo push error:", error.response?.data || error.message);
      return res.status(500).json({ error: "Failed to send notification." });
    }
  }
);

// Batch notifications
exports.sendBatchDeliveryNotifications = functions.https.onRequest(
  async (req, res) => {
    const { notifications } = req.body;

    if (!Array.isArray(notifications)) {
      return res.status(400).json({ error: "Invalid notifications array." });
    }

    try {
      const expoResponses = await Promise.all(
        notifications.map((notification) =>
          axios.post(EXPO_ENDPOINT, {
            to: notification.pushToken,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: "default",
          })
        )
      );

      return res.status(200).json({
        success: true,
        results: expoResponses.map((r) => r.data),
      });
    } catch (error) {
      console.error("Batch push error:", error.response?.data || error.message);
      return res
        .status(500)
        .json({ error: "Failed to send some notifications." });
    }
  }
);

// Test notification
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
  const { pushToken, title, body } = req.body;

  if (!pushToken || !title || !body) {
    return res
      .status(400)
      .json({ error: "Missing fields for test notification." });
  }

  try {
    const response = await axios.post(EXPO_ENDPOINT, {
      to: pushToken,
      title,
      body,
      sound: "default",
    });

    return res.status(200).json({ success: true, response: response.data });
  } catch (error) {
    console.error("Test push error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to send test notification." });
  }
});

// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const axios = require("axios");

// admin.initializeApp();

// const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// // CORS middleware
// const corsHandler = (req, res, next) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
//     res.status(204).send("");
//     return;
//   }

//   next();
// };

// exports.sendDeliveryNotification = functions.https.onRequest(
//   async (req, res) => {
//     // Handle CORS
//     corsHandler(req, res, () => {});
//     if (req.method === "OPTIONS") return;

//     const { pushToken, title, body, data } = req.body;

//     console.log("📨 Received notification request:", {
//       pushToken: pushToken ? `${pushToken.substring(0, 20)}...` : "null",
//       title,
//       body,
//     });

//     if (!pushToken || !title || !body) {
//       console.log("❌ Missing required fields");
//       return res.status(400).json({
//         success: false,
//         error:
//           "Missing required fields: pushToken, title, and body are required.",
//       });
//     }

//     try {
//       const response = await axios.post(EXPO_ENDPOINT, {
//         to: pushToken,
//         title,
//         priority: "high",
//         body,
//         data,
//         sound: "default",
//       });

//       console.log("✅ Expo API Response:", response.data);

//       // Check if Expo returned an error
//       if (
//         response.data &&
//         response.data.data &&
//         response.data.data.status === "error"
//       ) {
//         console.error("❌ Expo returned error:", response.data.data);
//         return res.status(400).json({
//           success: false,
//           error: response.data.data.message || "Expo API returned an error",
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         response: response.data,
//         message: "Notification sent successfully",
//       });
//     } catch (error) {
//       console.error(
//         "❌ Expo push error:",
//         error.response?.data || error.message
//       );
//       return res.status(500).json({
//         success: false,
//         error: "Failed to send notification.",
//         details: error.response?.data || error.message,
//       });
//     }
//   }
// );

// exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
//   // Handle CORS
//   corsHandler(req, res, () => {});
//   if (req.method === "OPTIONS") return;

//   const { pushToken, title, body } = req.body;

//   console.log("🧪 Test notification request:", {
//     pushToken: pushToken ? `${pushToken.substring(0, 20)}...` : "null",
//     title,
//     body,
//   });

//   if (!pushToken || !title || !body) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing fields for test notification.",
//     });
//   }

//   try {
//     const response = await axios.post(EXPO_ENDPOINT, {
//       to: pushToken,
//       title,
//       body,
//       sound: "default",
//     });

//     console.log("✅ Test notification sent:", response.data);

//     return res.status(200).json({
//       success: true,
//       response: response.data,
//       message: "Test notification sent successfully",
//     });
//   } catch (error) {
//     console.error("❌ Test push error:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to send test notification.",
//       details: error.response?.data || error.message,
//     });
//   }
// });
