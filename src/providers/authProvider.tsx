import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { AuthContextType, UserType } from "@/src/types";
import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<ReturnType<
    typeof Notifications.addNotificationReceivedListener
  > | null>(null);
  const responseListener = useRef<ReturnType<
    typeof Notifications.addNotificationResponseReceivedListener
  > | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  // const [confirm, setConfirm] =
  //   useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const router = useRouter();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "39342535560-pv5jqk7rpdhtc11s3mpv899p0r2jten6.apps.googleusercontent.com",
    });
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        const userData = await updateUserData(firebaseUser.uid);
        if (userData) {
          setUser(userData);
          if (!expoPushToken) {
            await setupNotifications(firebaseUser.uid);
          }
          console.log("User data:", userData);
        }
      } else {
        setUser(null);
        console.log("User logged out:", user);
        cleanupNotifications();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setupNotifications = async (uid: string) => {
    try {
      // Check current permission status
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      console.log("📱 Current permission status:", existingStatus);

      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("📱 Requested permission status:", finalStatus);
      }

      if (finalStatus !== "granted") {
        console.log("❌ Push notification permissions not granted");
        return;
      }

      const token = await registerForPushNotificationsAsync();
      console.log("🎯 Generated push token:", token);

      if (token) {
        setExpoPushToken(token);

        // Save to Firestore
        await firestore().collection("users").doc(uid).set(
          {
            expoPushToken: token,
          },
          { merge: true }
        );

        console.log("💾 Token saved to Firestore for user:", uid);
      }

      // Test if listeners are working
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("🔔 [FOREGROUND] Notification Received:", notification);
          setNotification(notification);

          // Show an alert to confirm reception
          Alert.alert(
            "Order Received!",
            JSON.stringify(notification.request.content, null, 2)
          );
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          // console.log("🔔 [INTERACTION] Notification Tapped:", response);
          // Alert.alert(
          //   "Notification !",
          //   JSON.stringify(response.notification.request.content, null, 2)
          // );
        });

      console.log("✅ Notification listeners set up successfully");
    } catch (err: any) {
      setError(err);
      console.error("❌ Notification setup error:", err);
    }
  };

  const cleanupNotifications = () => {
    notificationListener.current?.remove();
    responseListener.current?.remove();
    notificationListener.current = null;
    responseListener.current = null;
    setExpoPushToken(null);
    setNotification(null);
  };

  //Phone Auth
  // const signInWithPhoneNumber = async () => {
  //   try {
  //     const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
  //     setConfirm(confirmation);
  //     Alert.alert("Code Sent", "Verification code sent to your phone");
  //   } catch (error) {
  //     console.error("Phone Auth Error:", error);
  //     Alert.alert("Error", "Failed to send verification code");
  //   }
  // };
  // const confirmCode = async () => {
  //   try {
  //     const userCredential = await confirm?.confirm(code);
  //     console.log("User signed in with phone:", userCredential?.user);
  //     Alert.alert("Success", "Phone number verified successfully");
  //   } catch (error) {
  //     console.error("Invalid code:", error);
  //     Alert.alert("Error", "Invalid verification code");
  //   }
  // };

  //Google Auth
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential =
        await auth().signInWithCredential(googleCredential);
      console.log("User signed in with Google:", userCredential.user);

      await firestore().collection("users").doc(userCredential.user.uid).set(
        {
          username: userCredential.user.displayName,
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          address: "",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      Alert.alert("Error", "Google Sign-In failed");
    } finally {
      setIsLoading(false);
    }
  };

  //Email Auth
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await auth().signInWithEmailAndPassword(email, password);

      if (!response.user.emailVerified) {
        await auth().signOut(); // prevent unverified login
        return {
          success: false,
          msg: "Please check your email and verify your email before signing in.",
        };
      }

      // Save user to Firestore
      const username = auth().currentUser?.displayName;
      await firestore().collection("users").doc(response.user.uid).set({
        username,
        email,
        uid: response.user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        address: "",
      });

      console.log("✅ Email login successful");
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: parseAuthError(error.message) };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      setIsLoading(true);

      const response = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      await response.user.updateProfile({ displayName: username });

      // Send verification email
      await response.user.sendEmailVerification();

      Alert.alert(
        "Verify Your Email",
        "We sent a verification email to your inbox. Please verify your email before signing in."
      );

      // Redirect to sign-in page manually
      router.push("/(auth)/sign-in");

      return { success: true };
    } catch (error: any) {
      return { success: false, msg: parseAuthError(error.message) };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const updateUserData = async (uid: string): Promise<UserType | null> => {
    try {
      const docSnap = await firestore().collection("users").doc(uid).get();
      const data = docSnap.data();
      return {
        uid: data?.uid,
        email: data?.email || null,
        username: data?.username || null,
        image: data?.image || null,
        address: data?.address || null,
        phoneNumber: data?.phoneNumber || null,
      };
    } catch (error) {
      console.error("Failed to update user data:", error);
      return null;
    }
  };

  const parseAuthError = (msg: string) => {
    if (msg.includes("(auth/invalid-email)")) return "Invalid email";
    if (msg.includes("(auth/invalid-credential)")) return "Wrong credentials";
    if (msg.includes("(auth/user-not-found)")) return "User not found";
    if (msg.includes("(auth/wrong-password)")) return "Wrong password";
    if (msg.includes("(auth/too-many-requests)"))
      return "Too many attempts. Try again later";
    if (msg.includes("(auth/email-already-in-use)"))
      return "Email already in use";
    if (msg.includes("(auth/weak-password)")) return "Password too weak";
    return "Authentication error";
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    logout,
    register,
    updateUserData,
    expoPushToken,
    notification,
    error,
    isLoading,
    signInWithGoogle,
    // signInWithPhoneNumber,
    // confirmCode,
    // confirm,
    phoneNumber,
    setPhoneNumber,
    code,
    setCode,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
