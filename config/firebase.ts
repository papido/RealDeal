// @/config/firebase.js
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { firebase } from "@react-native-firebase/app";

if (!firebase.apps.length) {
  firebase.initializeApp();
}

export { auth, firestore };
