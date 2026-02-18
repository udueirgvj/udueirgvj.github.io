// Firebase CDN (يعمل مع GitHub Pages)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, child, onValue, push } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// بيانات مشروعك (التي ارسلتها لي)
const firebaseConfig = {
  apiKey: "AIzaSyDRCtfuYrEdnuKUsWu_79NC6G_xGLznBJc",
  authDomain: "tttrt-b8c5a.firebaseapp.com",
  databaseURL: "https://tttrt-b8c5a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tttrt-b8c5a",
  storageBucket: "tttrt-b8c5a.firebasestorage.app",
  messagingSenderId: "975123752593",
  appId: "1:975123752593:web:e591e930af3a3e29568130"
};


// تشغيل فايربيس
const app = initializeApp(firebaseConfig);

// الخدمات
const auth = getAuth(app);
const db = getDatabase(app);

// التصدير للملفات
export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  ref,
  set,
  get,
  child,
  onValue,
  push
};
