import { firestore } from "@/config/firebase";
import Button from "@/src/components/Button";
import { useAuth } from "@/src/contexts/authProvider";
import { useCurrency } from "@/src/contexts/CurrencyProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ProfileScreen = () => {
  const { logout, changePassword, deleteAccount, user, updateUserData, setUser } =
    useAuth();
  const router = useRouter();
  const { currencySymbol } = useCurrency();
  const [editingField, setEditingField] = useState<"username" | "email" | null>(
    null
  );
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    width: 76,
    height: 38,
  });
  const currencyButtonRef = useRef<TouchableOpacity | null>(null);

  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || "",
    });
  }, [user?.username, user?.email]);

  const currencyOptions = [
    "$",
    "A$",
    "B$",
    "Bds$",
    "BZ$",
    "C$",
    "CFA",
    "DKK",
    "EC$",
    "EUR",
    "FJ$",
    "G$",
    "GHs",
    "HK$",
    "INR",
    "J$",
    "KES",
    "KSh",
    "L$",
    "Le",
    "MYR",
    "N$",
    "NGN",
    "NOK",
    "NZ$",
    "P",
    "PGK",
    "PHP",
    "PKR",
    "R",
    "RWF",
    "SEK",
    "S$",
    "TT$",
    "TZS",
    "TSh",
    "UGX",
    "USh",
    "ZK",
    "ZMW",
  ];

  const selectedCurrency =
    currencyOptions.find((option) => option === currencySymbol) || "$";

  const updateCurrency = async (nextSymbol: string) => {
    if (!user?.uid) return;
    await firestore().collection("users").doc(user.uid).update({
      currencySymbol: nextSymbol,
    });
    const updated = await updateUserData(user.uid);
    setUser(updated);
  };

  const toggleCurrencyDropdown = () => {
    if (currencyDropdownOpen) {
      setCurrencyDropdownOpen(false);
      return;
    }

    currencyButtonRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({ x, y, width, height });
      setCurrencyDropdownOpen(true);
    });
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently removes your account and profile data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              const result = await deleteAccount();
              if (!result.success) {
                Alert.alert("Delete failed", result.msg || "Unable to delete account.");
              }
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert(
        "Invalid password",
        "New password must be different from current password.",
      );
      return;
    }

    try {
      setIsChangingPassword(true);
      const result = await changePassword(currentPassword, newPassword);
      if (!result.success) {
        Alert.alert("Change failed", result.msg || "Could not change password.");
        return;
      }
      closePasswordModal();
      Alert.alert("Success", "Your password has been updated.");
    } finally {
      setIsChangingPassword(false);
    }
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

      <View style={styles.card}>
        <LinearGradient
          colors={["#fef3c7", "#fde68a"]}
          style={styles.cardGradient}
        >
          <View style={styles.currencyHeaderRow}>
            <Text style={[styles.label, styles.currencyLabel]}>Currency</Text>
            <View style={styles.currencyDropdownAnchor}>
              <TouchableOpacity
                ref={currencyButtonRef}
                style={styles.currencyDropdownButton}
                onPress={toggleCurrencyDropdown}
              >
                <Text style={styles.currencyDropdownButtonText}>
                  {selectedCurrency}
                </Text>
                <Ionicons
                  name={currencyDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#854d0e"
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <Modal
        visible={currencyDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyDropdownOpen(false)}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => setCurrencyDropdownOpen(false)}
        />
        <View
          style={[
            styles.currencyDropdownListWrap,
            {
              top: dropdownPosition.y + dropdownPosition.height + 6,
              left: Math.max(12, dropdownPosition.x + dropdownPosition.width - 98),
            },
          ]}
        >
          <ScrollView style={styles.currencyDropdownList}>
            {currencyOptions.map((option) => {
              const isSelected = currencySymbol === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.currencyDropdownItem,
                    isSelected && styles.currencyDropdownItemSelected,
                  ]}
                  onPress={() => {
                    updateCurrency(option);
                    setCurrencyDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.currencyDropdownItemText,
                      isSelected && styles.currencyDropdownItemTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

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
      <TouchableOpacity
        style={styles.policyBtn}
        onPress={() => router.push("/(user)/profile/privacy-policy")}
      >
        <Text style={styles.policyText}>Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.changePasswordBtn}
        onPress={() => setShowPasswordModal(true)}
      >
        <Text style={styles.changePasswordText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteBtn, isDeletingAccount && styles.deleteBtnDisabled]}
        onPress={handleDeleteAccount}
        disabled={isDeletingAccount}
      >
        <Text style={styles.deleteText}>
          {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <View style={styles.passwordModalBackdrop}>
          <View style={styles.passwordModalCard}>
            <Text style={styles.passwordModalTitle}>Change Password</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={passwordForm.currentPassword}
              onChangeText={(t) =>
                setPasswordForm((p) => ({ ...p, currentPassword: t }))
              }
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={passwordForm.newPassword}
              onChangeText={(t) => setPasswordForm((p) => ({ ...p, newPassword: t }))}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={passwordForm.confirmPassword}
              onChangeText={(t) =>
                setPasswordForm((p) => ({ ...p, confirmPassword: t }))
              }
            />
            <View style={styles.passwordActionsRow}>
              <TouchableOpacity
                style={styles.passwordCancelBtn}
                onPress={closePasswordModal}
                disabled={isChangingPassword}
              >
                <Text style={styles.passwordCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.passwordSubmitBtn,
                  isChangingPassword && styles.passwordSubmitBtnDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.passwordSubmitText}>
                  {isChangingPassword ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  currencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currencyLabel: {
    marginBottom: 0,
  },
  currencyDropdownAnchor: {
    alignItems: "flex-end",
  },
  currencyDropdownButton: {
    borderWidth: 1,
    borderColor: "#a16207",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff7cc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 76,
  },
  currencyDropdownButtonText: {
    color: "#854d0e",
    fontWeight: "600",
    marginRight: 6,
    textAlign: "center",
  },
  currencyDropdownListWrap: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#a16207",
    borderRadius: 10,
    backgroundColor: "#fffdf0",
    overflow: "hidden",
    minWidth: 90,
    zIndex: 30,
    elevation: 30,
  },
  currencyDropdownList: {
    maxHeight: 240,
  },
  currencyDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  currencyDropdownItemSelected: {
    backgroundColor: "#fde68a",
  },
  currencyDropdownItemText: {
    color: "#0f172a",
    fontSize: 13,
  },
  currencyDropdownItemTextSelected: {
    color: "#854d0e",
    fontWeight: "700",
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  policyBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#bae6fd",
    backgroundColor: "rgba(2, 132, 199, 0.22)",
    padding: 14,
    borderRadius: 10,
  },
  policyText: {
    textAlign: "center",
    color: "#e0f2fe",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: 12,
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
  changePasswordBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#99f6e4",
    backgroundColor: "rgba(13, 148, 136, 0.26)",
    padding: 14,
    borderRadius: 10,
  },
  changePasswordText: {
    textAlign: "center",
    color: "#ccfbf1",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "rgba(127, 29, 29, 0.22)",
    padding: 14,
    borderRadius: 10,
  },
  deleteBtnDisabled: {
    opacity: 0.65,
  },
  deleteText: {
    textAlign: "center",
    color: "#fee2e2",
    fontWeight: "bold",
    fontSize: 16,
  },
  passwordModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  passwordModalCard: {
    backgroundColor: "#0b1220",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
  },
  passwordModalTitle: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    color: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  passwordActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  passwordCancelBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  passwordCancelText: {
    color: "#cbd5e1",
    fontWeight: "600",
  },
  passwordSubmitBtn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  passwordSubmitBtnDisabled: {
    opacity: 0.7,
  },
  passwordSubmitText: {
    color: "#e0f2fe",
    fontWeight: "700",
  },
});
