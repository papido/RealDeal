import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthContextType, UserType } from "@/src/constants/types";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          console.log("User data:", userData);
        }
      } else {
        setUser(null);
        console.log("User logged out:", user);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
          currencySymbol: "$",
          lastSignedIn: firestore.FieldValue.serverTimestamp(),
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

      // Save user to Firestore
      const username = auth().currentUser?.displayName;
      await firestore().collection("users").doc(response.user.uid).set(
        {
          username,
          email,
          uid: response.user.uid,
          currencySymbol: "$",
          lastSignedIn: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Email login successful");
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: parseAuthError(error) };
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

      return { success: true };
    } catch (error: any) {
      return { success: false, msg: parseAuthError(error) };
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
      const docRef = firestore().collection("users").doc(uid);
      const docSnap = await docRef.get();
      type UserDocData = {
        uid?: string;
        email?: string | null;
        username?: string | null;
        image?: any;
        address?: string | null;
        phoneNumber?: string | null;
        currencySymbol?: string;
        aiCredits?: number;
      };
      let data = docSnap.data() as UserDocData | undefined;
      const authUser = auth().currentUser;
      const defaults: Partial<UserDocData> = {};
      if (typeof data?.aiCredits !== "number") defaults.aiCredits = 5;
      if (!data?.currencySymbol) defaults.currencySymbol = "$";
      if (Object.keys(defaults).length > 0) {
        await docRef.set(defaults, { merge: true });
        data = { ...(data ?? {}), ...defaults };
      }
      return {
        uid: data?.uid || authUser?.uid,
        email: data?.email || authUser?.email || undefined,
        username: data?.username || authUser?.displayName || "",
        image: data?.image || null,
        address: data?.address || undefined,
        phoneNumber: data?.phoneNumber || "",
        currencySymbol: data?.currencySymbol || "$",
        aiCredits: data?.aiCredits,
      };
    } catch (error) {
      console.error("Failed to update user data:", error);
      return null;
    }
  };

  const parseAuthError = (error: any) => {
    const code = error?.code || "";
    const msg = error?.message || "";
    if (code === "auth/invalid-email" || msg.includes("(auth/invalid-email)"))
      return "Invalid email";
    if (
      code === "auth/invalid-credential" ||
      msg.includes("(auth/invalid-credential)")
    )
      return "Wrong credentials";
    if (code === "auth/user-not-found" || msg.includes("(auth/user-not-found)"))
      return "User not found";
    if (code === "auth/wrong-password" || msg.includes("(auth/wrong-password)"))
      return "Wrong password";
    if (
      code === "auth/too-many-requests" ||
      msg.includes("(auth/too-many-requests)")
    )
      return "Too many attempts. Try again later";
    if (
      code === "auth/email-already-in-use" ||
      msg.includes("(auth/email-already-in-use)")
    )
      return "An account with this email already exists. Please sign in.";
    if (code === "auth/weak-password" || msg.includes("(auth/weak-password)"))
      return "Password too weak";
    return "Authentication error";
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    logout,
    register,
    updateUserData,
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
