import { firestore } from "@/config/firebase";
import Button from "@/src/components/Button";
import { useAuth } from "@/src/contexts/authProvider";
import { useCart } from "@/src/contexts/CartProvider";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ProfileScreen = () => {
  const { logout, user, updateUserData, setUser } = useAuth();
  const { getLocation, calculateDeliveryFromAddress } = useCart();
  const [editingField, setEditingField] = useState<"username" | "email" | null>(
    null
  );
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || "",
    });
  }, [user?.username, user?.email]);

  const updateField = async (field: "username" | "email") => {
    if (!user?.uid) return;
    await firestore()
      .collection("users")
      .doc(user.uid)
      .update({
        [field]: form[field],
      });
    const updated = await updateUserData(user.uid);
    setUser(updated);
    setEditingField(null);
  };

  const handleEdit = (field: "username" | "email") => {
    setForm({ username: user?.username || "", email: user?.email || "" });
    setEditingField(field);
  };

  const updateAddressAndDelivery = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Cannot access your location.");
        setLocationLoading(false);
        return;
      }

      const location = await getLocation();
      const [address] = await Location.reverseGeocodeAsync(location.coords);
      const fullAddress = `${address.name}, ${address.street}, ${address.postalCode}, ${address.city}, ${address.region}`;

      await firestore().collection("users").doc(user?.uid).update({
        address: fullAddress,
      });

      const updated = await updateUserData(user?.uid!);
      setUser(updated);

      let message = "Address updated!";
      try {
        await calculateDeliveryFromAddress(fullAddress);
        message += " Delivery calculated for your address.";
      } catch {
        message += " But delivery rate calculation failed.";
      }

      Alert.alert("Success", message);
    } catch (err) {
      console.error("Location error", err);
      Alert.alert("Error", "Failed to get address.");
    }
    setLocationLoading(false);
  };

  return (
    <LinearGradient
      colors={["#0b1f16", "#0f2a1c", "#122f21"]}
      style={styles.container}
    >
      {/* Username Section */}
      <View style={styles.card}>
        <LinearGradient
          colors={["#fef3c7", "#fde68a"]}
          style={styles.cardGradient}
        >
          <Text style={styles.label}>Username</Text>
          {editingField === "username" ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={form.username}
              onChangeText={(t) => setForm((f) => ({ ...f, username: t }))}
            />
            <Button
              onPress={() => updateField("username")}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontWeight: "bold", color: "#fff" }}>Save</Text>
            </Button>
          </View>
        ) : (
          <View style={styles.displayRow}>
            <Text style={styles.text}>{user?.username}</Text>
            <TouchableOpacity onPress={() => handleEdit("username")}>
              <Text style={styles.edit}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        </LinearGradient>
      </View>

      {/* Email Section */}
      <View style={styles.card}>
        <LinearGradient
          colors={["#fef3c7", "#fde68a"]}
          style={styles.cardGradient}
        >
          <Text style={styles.label}>Email</Text>
          {editingField === "email" ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
            />
            <Button
              onPress={() => updateField("email")}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontWeight: "bold", color: "#fff" }}>Save</Text>
            </Button>
          </View>
        ) : (
          <View style={styles.displayRow}>
            <Text style={styles.text}>{user?.email}</Text>
            <TouchableOpacity onPress={() => handleEdit("email")}>
              <Text style={styles.edit}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        </LinearGradient>
      </View>

      {/* Address Section (disabled for now) */}
      {/* <View style={styles.card}>
        <LinearGradient
          colors={["#fef3c7", "#fde68a"]}
          style={styles.cardGradient}
        >
          <Text style={styles.label}>Address</Text>
          <View style={styles.displayRow}>
            <Text style={[styles.text, { flex: 1 }]}>
              {user?.address || "No address set"}
            </Text>
            <TouchableOpacity
              onPress={updateAddressAndDelivery}
              disabled={locationLoading}
            >
              <Text style={[styles.edit, locationLoading && styles.disabled]}>
                {locationLoading
                  ? "Updating..."
                  : user?.address
                    ? "Update"
                    : "Set Address"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View> */}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "transparent",
  },
  card: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  cardGradient: {
    borderRadius: 12,
    padding: 14,
  },
  label: {
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 4,
    fontWeight: "600",
  },
  text: {
    fontSize: 16,
    color: "#0f172a",
  },
  displayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    borderColor: "#cbd5f5",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  edit: {
    color: "#60a5fa",
    fontWeight: "500",
  },
  disabled: {
    color: "#bbb",
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#f44336",
    padding: 14,
    borderRadius: 10,
  },
  logoutText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
