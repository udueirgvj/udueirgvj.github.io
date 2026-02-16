// عند تحميل التطبيق
window.onload = function(){

const chatList = document.getElementById("chatList");

chatList.innerHTML = `
<div style="
padding:20px;
text-align:center;
color:white;
font-size:18px;
margin-top:40px;
">

👋 أهلاً ${currentUser}

<br><br>

اضغط 🔍 في الأعلى
وابحث عن اسم مستخدم
لبدء محادثة خاصة

</div>
`;

};
