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
