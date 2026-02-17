import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const btn = document.getElementById("registerBtn");

btn.onclick = async () => {

  const username = document.getElementById("username").value.trim().toLowerCase();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (username.length < 5) {
    alert("اسم المستخدم يجب ان يكون 5 احرف على الأقل");
    return;
  }

  // تحقق ان الاسم غير مستخدم
  const usernameRef = ref(db, "usernames/" + username);
  const snap = await get(usernameRef);

  if (snap.exists()) {
    alert("اسم المستخدم مستخدم مسبقاً");
    return;
  }

  try {

    // انشاء الحساب
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // حفظ بيانات المستخدم
    await set(ref(db, "users/" + uid), {
      username: username,
      email: email
    });

    // حجز اسم المستخدم
    await set(ref(db, "usernames/" + username), uid);

    // 🔥 لا نعمل تحويل هنا
    // Firebase سيحولك تلقائياً عبر onAuthStateChanged

  } catch (e) {
    alert(e.message);
  }
};
