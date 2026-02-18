import { db } from "./firebase.js";
import { collection, query, where, getDocs } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function searchUser(username){

  username = username.replace("@","").toLowerCase();

  const q = query(
    collection(db, "users"),
    where("username","==",username)
  );

  const result = await getDocs(q);

  const box = document.getElementById("result");
  box.innerHTML = "";

  if(result.empty){
    box.innerHTML = "المستخدم غير موجود";
    return;
  }

  result.forEach(docu=>{
    const user = docu.data();

    box.innerHTML += `
      <div style="background:white;padding:12px;margin-top:10px;border-radius:10px">
        <b>@${user.username}</b><br>
        ${user.email}
      </div>
    `;
  });
}
