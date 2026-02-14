// ===================================================
// chat.js - كل ما يتعلق بالمحادثات الخاصة والجماعية
// مع واجهة "لا توجد رسائل" مثل تليجرام
// ===================================================

// كائن Chat الرئيسي (يدير المحادثات الخاصة والبوتات والمجموعات)
const Chat = {
    currentChat: null,
    currentChatId: null,
    currentChatType: null,
    currentChatUser: null,
    currentGroupId: null,
    messagesListener: null,
    presenceListeners: {},
    replyToMessage: null,
    forwardMessage: null,

    // دالة لعرض واجهة "لا توجد رسائل" بشكل جميل
    showEmptyChat(container, userName, userStatus, avatarChar) {
        container.innerHTML = `
            <div class="empty-chat-container">
                <div class="empty-chat-avatar">${avatarChar}</div>
                <div class="empty-chat-name">${userName}</div>
                <div class="empty-chat-status">${userStatus}</div>
                <div class="empty-chat-message">
                    ما من رسائل هنا بعد...<br>
                    يمكنك كتابة رسالة أو الضغط على الملصق لإرساله.
                    <small>✋ اضغط على أي رسالة للرد أو إعادة التوجيه</small>
                </div>
            </div>
        `;
    },

    // بدء محادثة خاصة مع مستخدم
    async startPrivate(uid, username, fullName) {
        // إذا كان المستخدم هو بوت TTDBOT
        if (uid === 'ttdbot') {
            await TTDBOT.startConversation(this, currentUser, db, this.sendBotMessage.bind(this));
            return;
        }
        // إذا كان المستخدم هو BotMaker
        if (uid === 'botmaker') {
            await BotMaker.startConversation(this, currentUser, db, this.sendBotMessage.bind(this));
            return;
        }

        this.currentChatType = 'private';
        this.currentChatUser = { uid, username, fullName };
        const ids = [currentUser.uid, uid].sort();
        this.currentChatId = `private_${ids[0]}_${ids[1]}`;
        
        // جلب حالة الاتصال
        const statusSnap = await db.ref(`status/${uid}`).once('value');
        const status = statusSnap.val();
        let statusText = '';
        if (status && status.state === 'online') statusText = '🟢 متصل';
        else {
            const lastSeen = status ? status.lastSeen : null;
            statusText = lastSeen ? `آخر ظهور ${this.timeAgo(lastSeen)}` : 'آخر ظهور غير معروف';
        }

        this.openChatUI(fullName, fullName.charAt(0), statusText);
        this.loadPrivateMessages(uid);
        
        // الاستماع لتغييرات حالة الاتصال
        this.presenceListeners[uid] = db.ref(`status/${uid}`).on('value', (snap) => {
            const s = snap.val();
            if (s && s.state === 'online') {
                document.getElementById('chatStatus').innerText = '🟢 متصل';
            } else {
                const lastSeen = s ? s.lastSeen : null;
                document.getElementById('chatStatus').innerText = lastSeen ? `آخر ظهور ${this.timeAgo(lastSeen)}` : 'آخر ظهور غير معروف';
            }
        });
    },

    // فتح الدردشة باستخدام اسم المستخدم (للروابط)
    startPrivateByUsername(username) {
        db.ref('users').orderByChild('username').equalTo(username).once('value', (snap) => {
            if (snap.exists()) {
                snap.forEach(child => {
                    const user = child.val();
                    this.startPrivate(user.uid, user.username, user.fullName);
                });
            } else {
                db.ref('bots').orderByChild('username').equalTo(username).once('value', (snap) => {
                    if (snap.exists()) {
                        snap.forEach(child => {
                            const bot = child.val();
                            this.startPrivate(bot.username, bot.username, bot.name);
                        });
                    } else {
                        alert('المستخدم غير موجود');
                    }
                });
            }
        });
    },

    // حساب الوقت المنقضي
    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'منذ لحظات';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `منذ ${hours} ساعة`;
        const days = Math.floor(hours / 24);
        return `منذ ${days} يوم`;
    },

    // فتح واجهة الدردشة
    openChatUI(name, avatarChar, status) {
        const nameSpan = document.getElementById('chatName');
        if (name === 'TTDBOT') {
            nameSpan.innerHTML = name + ' <span class="verified-badge">موثق</span>';
        } else if (name === 'BotMaker') {
            nameSpan.innerHTML = name + ' <span style="background:#9c27b0; color:white; padding:2px 6px; border-radius:12px; font-size:10px;">صانع البوتات</span>';
        } else {
            nameSpan.innerText = name;
        }
        document.getElementById('chatAvatar').innerText = avatarChar;
        document.getElementById('chatStatus').innerText = status;
        document.getElementById('chatRoom').classList.add('open');
    },

    // إغلاق الدردشة
    close() {
        document.getElementById('chatRoom').classList.remove('open');
        if (this.messagesListener) this.messagesListener.off();
        Object.keys(this.presenceListeners).forEach(uid => {
            db.ref(`status/${uid}`).off('value', this.presenceListeners[uid]);
        });
        this.presenceListeners = {};
        this.messagesListener = null;
        this.currentChat = null;
        this.currentChatId = null;
        this.currentChatUser = null;
        this.currentGroupId = null;
        this.replyToMessage = null;
        this.forwardMessage = null;
    },

    // تحميل الرسائل الخاصة
    loadPrivateMessages(otherUid) {
        const messagesRef = db.ref(`messages/${this.currentChatId}`);
        this.messagesListener = messagesRef.orderByChild('timestamp').on('value', (snap) => {
            this.displayMessages(snap);
        });
    },

    // تحميل رسائل المجموعة
    loadGroupMessages(groupId) {
        this.currentGroupId = groupId;
        const messagesRef = db.ref(`groupMessages/${groupId}`);
        this.messagesListener = messagesRef.orderByChild('timestamp').on('value', (snap) => {
            this.displayMessages(snap, true);
        });
    },
    // ===================================================
// كائن Channel (قناة المطور) - جزء من المحادثات
// ===================================================
const Channel = {
    open() {
        alert('قناة المطور: سيتم فتحها قريباً');
    }
};

// ===================================================
// قائمة المحادثات (الخاصة والعامة)
// ===================================================
let chatListListener = null;

function loadChatList() {
    if (chatListListener) chatListListener.off();
    
    const conversations = new Map();
    const uid = currentUser.uid;

    chatListListener = db.ref('messages').on('value', async (snapshot) => {
        conversations.clear();

        // جمع المحادثات الخاصة
        snapshot.forEach(chatSnap => {
            const msgs = chatSnap.val();
            if (msgs && typeof msgs === 'object') {
                Object.values(msgs).forEach(msg => {
                    if (msg.senderId === uid || msg.receiverId === uid) {
                        const otherId = msg.senderId === uid ? msg.receiverId : msg.senderId;
                        if (!conversations.has(otherId) || conversations.get(otherId).timestamp < msg.timestamp) {
                            conversations.set(otherId, {
                                id: otherId,
                                type: 'user',
                                lastMessage: msg.text,
                                timestamp: msg.timestamp
                            });
                        }
                    }
                });
            }
        });

        // جمع المجموعات التي هو عضو فيها
        const memberSnap = await db.ref('groupMembers').orderByChild('uid').equalTo(uid).once('value');
        memberSnap.forEach(member => {
            const groupId = member.key;
            db.ref(`groupMessages/${groupId}`).orderByChild('timestamp').limitToLast(1).once('value', snap => {
                let lastMsg = 'أنشئت حديثاً', lastTime = Date.now();
                snap.forEach(m => { lastMsg = m.val().text; lastTime = m.val().timestamp; });
                conversations.set(`group_${groupId}`, {
                    id: groupId,
                    type: 'group',
                    lastMessage: lastMsg,
                    timestamp: lastTime
                });
                renderChatList(Array.from(conversations.values()));
            });
        });

        // إضافة البوتات إلى القائمة (ثابتة)
        conversations.set('ttdbot', { id: 'ttdbot', type: 'bot', lastMessage: 'بوت إنشاء البوتات', timestamp: Date.now() });
        conversations.set('botmaker', { id: 'botmaker', type: 'botmaker', lastMessage: 'صانع البوتات المتقدم', timestamp: Date.now() });

        renderChatList(Array.from(conversations.values()));
    });
}

// عرض قائمة المحادثات في الواجهة
async function renderChatList(list) {
    const container = document.getElementById('chatListContainer');
    container.innerHTML = '';
    list.sort((a, b) => b.timestamp - a.timestamp);

    for (let item of list) {
        const div = document.createElement('div');
        div.className = 'chat-list-item';

        if (item.type === 'user') {
            const userSnap = await db.ref('users').orderByChild('uid').equalTo(item.id).once('value');
            if (!userSnap.exists()) continue;
            let user;
            userSnap.forEach(u => user = u.val());
            
            const statusSnap = await db.ref(`status/${user.uid}`).once('value');
            const status = statusSnap.val();
            const isOnline = status && status.state === 'online';
            
            div.innerHTML = `<div class="chat-avatar" style="position:relative;">
                    ${user.photoURL ? `<img src="${user.photoURL}">` : user.fullName.charAt(0)}
                    <span class="${isOnline ? 'online-indicator' : 'offline-indicator'}"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-name"><span>${user.fullName}</span><span class="chat-time">${new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div class="chat-last-msg">${item.lastMessage}</div>
                </div>`;
            div.onclick = () => Chat.startPrivate(user.uid, user.username, user.fullName);
        } else if (item.type === 'group') {
            const groupSnap = await db.ref(`groups/${item.id}`).once('value');
            const group = groupSnap.val();
            if (!group) continue;
            div.innerHTML = `<div class="chat-avatar" style="border-radius:${group.type === 'channel' ? '8px' : '50%'};">${group.type === 'channel' ? '📢' : '👥'}</div>
                <div class="chat-info">
                    <div class="chat-name"><span>${group.name}</span><span class="chat-time">${new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div class="chat-last-msg">${item.lastMessage}</div>
                </div>`;
            div.onclick = () => GroupsAndChannels.open(group.id);
        } else if (item.type === 'bot') {
            div.innerHTML = `<div class="chat-avatar" style="background:#2196f3;">🤖</div>
                <div class="chat-info">
                    <div class="chat-name"><span>TTDBOT <span class="verified-badge">موثق</span></span><span class="chat-time"></span></div>
                    <div class="chat-last-msg">${item.lastMessage}</div>
                </div>`;
            div.onclick = () => Chat.startPrivate('ttdbot', 'ttdbot', 'TTDBOT');
        } else if (item.type === 'botmaker') {
            div.innerHTML = `<div class="chat-avatar" style="background:#9c27b0;">🤖</div>
                <div class="chat-info">
                    <div class="chat-name"><span>BotMaker <span style="background:#9c27b0; color:white; padding:2px 6px; border-radius:12px;">صانع البوتات</span></span><span class="chat-time"></span></div>
                    <div class="chat-last-msg">${item.lastMessage}</div>
                </div>`;
            div.onclick = () => Chat.startPrivate('botmaker', 'botmaker', 'BotMaker');
        }
        container.appendChild(div);
    }
    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">لا توجد محادثات بعد</div>';
    }
}

// تصدير الدوال والكائنات لاستخدامها في الملفات الأخرى
window.Chat = Chat;
window.Channel = Channel;
window.loadChatList = loadChatList;
/* واجهة الدردشة الجديدة - مثل تليجرام */
.empty-chat-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #f9f9f9;
    padding: 20px;
}

.empty-chat-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #667eea;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 48px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.empty-chat-name {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
}

.empty-chat-status {
    font-size: 14px;
    color: #666;
    margin-bottom: 30px;
}

.empty-chat-message {
    text-align: center;
    color: #999;
    font-size: 16px;
    line-height: 1.6;
    max-width: 300px;
}

.empty-chat-message small {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #ccc;
}
