import { colors } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/authProvider";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const onSubmit = async () => {
    Keyboard.dismiss();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      Alert.alert("Sign up", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    const res = await register(trimmedEmail, trimmedPassword, trimmedUsername);
    setLoading(false);
    if (!res.success) {
      Alert.alert("Sign up", res.msg);
    }
    resetFields();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: "Sign up" }} />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Let’s get started with your journey.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="jonmill"
              style={styles.input}
            />
          </View>

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
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Button loading={loading} onPress={onSubmit}>
            <Text style={styles.buttonText}>Create Account</Text>
          </Button>

          <TouchableOpacity onPress={() => router.push("/sign-in")}>
            <Text style={styles.linkText}>
              Already have an account ? Sign in here
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f9f9fb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  buttonText: {
    alignSelf: "center",
    fontWeight: "600",
    fontSize: 16,
    color: "white",
  },
  linkText: {
    alignSelf: "center",
    marginTop: 16,
    fontSize: 14,
    color: colors.black,
    fontWeight: "600",
  },
});

export default SignUpScreen;
