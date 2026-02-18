import { colors } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/authProvider";
import { AntDesign, Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Button from "../../components/Button";

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const validateInput = () => {
    setErrors("");
    if (!email) {
      setErrors("Email is required");
      return false;
    }
    if (!password) {
      setErrors("Password is required");
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    Keyboard.dismiss();
    if (!validateInput()) return;

    setLoading(true);
    const res = await login(trimmedEmail, trimmedPassword);
    setLoading(false);

    if (!res.success) {
      Alert.alert("Sign in", res.msg);
      return;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              title: "Sign in",
              headerBackVisible: false,
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />

          <Image
            source={require("@assets/images/iconImage.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="jon@gmail.com"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                style={[styles.input, { paddingRight: 40 }]}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>

          {errors !== "" && <Text style={styles.errorText}>{errors}</Text>}

          <Button loading={loading} onPress={onSubmit}>
            <Text style={styles.buttonText}>Sign In</Text>
          </Button>

          <TouchableOpacity
            onPress={signInWithGoogle}
            style={styles.socialButton}
          >
            <AntDesign
              name="google"
              size={20}
              color="white"
              style={styles.icon}
            />
            <Text style={styles.socialButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/sign-up")}>
            <Text style={styles.linkText}>
              Don’t have an account ? Sign up here
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: "#f9f9fb",
    justifyContent: "center",
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#555",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 13,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "white",
    alignSelf: "center",
  },
  googleButton: {
    backgroundColor: "#4285F4",
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  googleButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  linkText: {
    color: colors.black,
    fontWeight: "600",
    marginTop: 25,
    textAlign: "center",
    fontSize: 14,
  },
  resendButton: {
    backgroundColor: "#FFD700",
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  resendButtonText: {
    textAlign: "center",
    fontWeight: "bold",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    marginHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default SignInScreen;
