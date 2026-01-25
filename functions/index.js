const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

// Expo Push Endpoint
const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

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

// Convert ingredient units using AI (e.g., tbsp -> g for density-based items)
exports.convertIngredientUnit = onRequest(
  { secrets: [OPENAI_API_KEY] },
  async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { ingredientName, quantity, unit, targetUnit, density, state } =
    req.body || {};

  if (
    !ingredientName ||
    typeof ingredientName !== "string" ||
    typeof quantity !== "number" ||
    !unit ||
    !targetUnit
  ) {
    res.status(400).json({
      error:
        "Missing or invalid fields: ingredientName, quantity, unit, targetUnit.",
    });
    return;
  }

  const apiKey = OPENAI_API_KEY.value();
  if (!apiKey) {
    res.status(500).json({ error: "Missing OpenAI API key." });
    return;
  }

  const prompt = [
    "You convert cooking measurements to a target unit.",
    "Use density (g/ml) if provided when converting between volume and mass.",
    "If density is unknown, estimate a reasonable density for common foods.",
    "Return null amount if conversion is not possible.",
    "",
    `Ingredient: ${ingredientName}`,
    `Quantity: ${quantity}`,
    `From unit: ${unit}`,
    `Target unit: ${targetUnit}`,
    `Density g/ml: ${typeof density === "number" ? density : "unknown"}`,
    `State: ${state || "unknown"}`,
  ].join("\n");

  try {
    const response = await axios.post(
      OPENAI_ENDPOINT,
      {
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content:
              "Return JSON only. Keep numbers reasonable for cooking. If unsure, return null amount.",
          },
          { role: "user", content: prompt },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "unit_conversion",
            schema: {
              type: "object",
              properties: {
                amount: { type: ["number", "null"] },
                unit: { type: "string" },
                usedDensity: { type: "boolean" },
                densityEstimated: { type: "boolean" },
                notes: { type: "string" },
              },
              additionalProperties: false,
              required: [
                "amount",
                "unit",
                "usedDensity",
                "densityEstimated",
                "notes",
              ],
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const output =
      response.data?.output_text ||
      response.data?.output?.[0]?.content
        ?.map((item) => item.text)
        .filter(Boolean)
        .join("") ||
      response.data?.output?.[0]?.content?.[0]?.text;
    if (!output) {
      res.status(500).json({
        error: "No response content from model.",
        details: response.data,
      });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (error) {
      res.status(500).json({ error: "Failed to parse model response." });
      return;
    }

    res.status(200).json({
      success: true,
      result: parsed,
    });
  } catch (error) {
    console.error(
      "OpenAI conversion error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Conversion failed.",
      details: error.response?.data || error.message,
    });
  }
  }
);
