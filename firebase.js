<!-- firebase.js -->// استيراد فايربيس بطريقة صحيحة للمواقع العادية (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  child 
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// بيانات مشروعك (التي أرسلتها)
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
const auth = getAuth(app);
const db = getDatabase(app);

// تصدير للاستخدام ببقية الصفحات
export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, ref, set, get, child };
