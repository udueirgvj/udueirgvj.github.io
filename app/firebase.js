// Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// 🔴 بيانات مشروعك (وضعتها لك من الصورة)
const firebaseConfig = {
  apiKey: "AIzaSyDRCtfuYrEdnuKUsWu_79N0",
  authDomain: "tttrt-b8c5a.firebaseapp.com",
  databaseURL: "https://tttrt-b8c5a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tttrt-b8c5a",
  storageBucket: "tttrt-b8c5a.appspot.com",
  messagingSenderId: "975123752593",
  appId: "1:975123752593:web:e591e930af101968875560",
  measurementId: "G-VJVEB51FEW"
};


// تشغيل فايربيس
const app = initializeApp(firebaseConfig);

// المصادقة (تسجيل الدخول)
const auth = getAuth(app);

// قاعدة البيانات
const db = getDatabase(app);


// نصدرهم لباقي الملفات
export { auth, db };
