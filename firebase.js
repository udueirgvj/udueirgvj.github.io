// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// بيانات مشروعك (لا تغيّرها)
const firebaseConfig = {
  apiKey: "ضع_apiKey_هنا",
  authDomain: "ضع_authDomain_هنا",
  databaseURL: "ضع_databaseURL_هنا",
  projectId: "ضع_projectId_هنا",
  storageBucket: "ضع_storageBucket_هنا",
  messagingSenderId: "ضع_messagingSenderId_هنا",
  appId: "ضع_appId_هنا"
};

// تشغيل فايربيس
const app = initializeApp(firebaseConfig);

// تسجيل الدخول
export const auth = getAuth(app);

// 🔴 هذا أهم سطر في المشروع كله
setPersistence(auth, browserLocalPersistence);

// قاعدة البيانات
export const db = getDatabase(app);
