import { db } from "./firebase.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

const searchBtn = document.getElementById("openSearch");
const searchBox = document.getElementById("searchBox");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");

if(searchBtn){
searchBtn.onclick = () => {
    searchBox.style.display = "block";
};
}

window.searchUser = async function(){

    let value = searchInput.value.trim().toLowerCase();
    results.innerHTML = "";

    if(value === "") return;

    const snapshot = await get(ref(db,"users"));

    if(!snapshot.exists()){
        results.innerHTML = "<p>لا يوجد مستخدمين</p>";
        return;
    }

    snapshot.forEach(childSnap => {

        let user = childSnap.val();
        let username = user.username.toLowerCase();

        if(username.includes(value)){

            const div = document.createElement("div");
            div.className = "user-result";
            div.innerHTML = "@" + user.username;

            div.onclick = () => {

                // حفظ الشخص الذي سيتم فتح محادثته
                localStorage.setItem("chatWith", user.uid);
                localStorage.setItem("chatWithName", user.username);

                // التحويل الصحيح (هذا هو الإصلاح الحقيقي)
                window.location.href = "app/index.html";
            };

            results.appendChild(div);
        }

    });
};
