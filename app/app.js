const currentUser = localStorage.getItem("username");

if(!currentUser){
location.href="../login.html";
}

document.getElementById("welcomeName").innerText="👋 أهلاً " + currentUser;
document.getElementById("sideUser").innerText="@" + currentUser;

// إخفاء المحادثة بالبداية
document.getElementById("chatPage").style.display="none";

function openMenu(){
document.getElementById("sidebar").style.left="0";
document.getElementById("overlay").style.display="block";
}

function closeMenu(){
document.getElementById("sidebar").style.left="-260px";
document.getElementById("overlay").style.display="none";
}

// تسجيل الخروج
function logoutUser(){
localStorage.removeItem("username");
location.href="../login.html";
}
let currentChat = null;

/* فتح محادثة */
function openChat(uid, username){

    currentChat = uid;

    document.getElementById("welcome").style.display = "none";
    document.getElementById("chatPage").style.display = "flex";
    document.getElementById("chatUsername").innerText = "@" + username;

    closeSearch();
    loadMessages();
}

/* تحميل الرسائل */
function loadMessages(){

    const msgBox = document.getElementById("messages");
    msgBox.innerHTML = "";

    db.ref("privateChats/" + chatId())
    .on("child_added", snap => {

        const msg = snap.val();

        msgBox.innerHTML += `
        <div style="
        background:#1b2d45;
        padding:10px;
        border-radius:10px;
        margin:6px;
        ">
        <b>${msg.sender}</b><br>
        ${msg.text}
        </div>`;

        msgBox.scrollTop = msgBox.scrollHeight;
    });
}

/* إنشاء ID مشترك بين الشخصين */
function chatId(){
    return [currentUserUID, currentChat].sort().join("_");
}

/* إرسال رسالة */
function sendMessage(){

    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if(!text) return;

    db.ref("privateChats/" + chatId()).push({
        sender: currentUser,
        text: text,
        time: Date.now()
    });

    input.value="";
}
