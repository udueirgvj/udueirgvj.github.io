// ===================================================
// chat.js - كل ما يتعلق بالمحادثات الخاصة والجماعية
// (بدون كود البوتات - تم نقله إلى bots.js)
// ===================================================

let chatListListener = null;

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

    async startPrivate(uid, username, fullName) {
        if (uid === 'ttdbot') {
            await TTDBOT.startConversation(this, currentUser, db, this.sendBotMessage.bind(this));
            return;
        }
        if (uid === 'botmaker') {
            await BotMaker.startConversation(this, currentUser, db, this.sendBotMessage.bind(this));
            return;
        }

        this.currentChatType = 'private';
        this.currentChatUser = { uid, username, fullName };
        const ids = [currentUser.uid, uid].sort();
        this.currentChatId = `private_${ids[0]}_${ids[1]}`;
        
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

    loadPrivateMessages(otherUid) {
        const messagesRef = db.ref(`messages/${this.currentChatId}`);
        this.messagesListener = messagesRef.orderByChild('timestamp').on('value', (snap) => {
            this.displayMessages(snap);
        });
    },

    loadGroupMessages(groupId) {
        this.currentGroupId = groupId;
        const messagesRef = db.ref(`groupMessages/${groupId}`);
        this.messagesListener = messagesRef.orderByChild('timestamp').on('value', (snap) => {
            this.displayMessages(snap, true);
        });
    },

    async displayMessages(snapshot, isGroup = false) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        
        if (!snapshot.exists()) {
            let userName = this.currentChatUser?.fullName || 'المستخدم';
            let userStatus = document.getElementById('chatStatus')?.innerText || 'آخر ظهور غير معروف';
            let avatarChar = this.currentChatUser?.fullName?.charAt(0) || '👤';
            this.showEmptyChat(container, userName, userStatus, avatarChar);
            return;
        }
        
        const messages = [];
        snapshot.forEach(child => messages.push(child.val()));
        messages.sort((a, b) => a.timestamp - b.timestamp);

        for (let msg of messages) {
            const div = document.createElement('div');
            div.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
            div.setAttribute('onclick', `Chat.showMessageActions('${msg.messageId}', '${msg.text}')`);
            
            let senderHtml = '';
            if (isGroup && msg.senderId !== currentUser.uid) {
                const userSnap = await db.ref(`users/${msg.senderId}`).once('value');
                const user = userSnap.val();
                senderHtml = `<div class="sender-name">${user?.fullName || 'مستخدم'}</div>`;
            }
            
            let replyHtml = '';
            if (msg.replyTo) {
                replyHtml = `<div class="reply-preview" onclick="event.stopPropagation()">↩️ ${msg.replyTo}</div>`;
            }
            
            div.innerHTML = replyHtml + senderHtml + `<div>${window.linkify ? window.linkify(msg.text) : msg.text}</div><div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</div>`;
            container.appendChild(div);
        }
        container.scrollTop = container.scrollHeight;
    },

    showMessageActions(messageId, text) {
        const action = prompt('اختر:\n1️⃣ للرد على الرسالة\n2️⃣ لإعادة توجيه الرسالة\n3️⃣ للإشارة إلى عضو');
        if (action === '1') this.setReplyTo(messageId, text);
        else if (action === '2') {
            this.setForwardMessage(messageId, text);
            UI.openForwardModal();
        } else if (action === '3') this.showMentionSuggestions();
    },

    setReplyTo(messageId, text) {
        this.replyToMessage = { id: messageId, text };
        document.getElementById('messageInput').placeholder = `الرد على: ${text.substring(0, 20)}...`;
    },

    setForwardMessage(messageId, text) {
        this.forwardMessage = { id: messageId, text };
    },

    async forwardMessageTo(uid, username, fullName) {
        if (!this.forwardMessage) return;
        
        const ids = [currentUser.uid, uid].sort();
        const chatId = `private_${ids[0]}_${ids[1]}`;
        
        const msg = {
            messageId: db.ref().push().key,
            senderId: currentUser.uid,
            receiverId: uid,
            text: `↪️ تمت إعادة توجيهها: ${this.forwardMessage.text}`,
            timestamp: Date.now(),
            forwarded: true
        };
        
        await db.ref(`messages/${chatId}/${msg.messageId}`).set(msg);
        UI.closeForwardModal();
        this.forwardMessage = null;
        alert('تم إعادة توجيه الرسالة بنجاح');
    },

    clearReply() {
        this.replyToMessage = null;
        document.getElementById('messageInput').placeholder = 'اكتب رسالة...';
    },

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !this.currentChatId) return;

        if (this.currentChatType === 'bot') {
            await TTDBOT.handleMessage(text, currentUser, db, this.sendBotMessage.bind(this));
            input.value = '';
            return;
        }
        if (this.currentChatType === 'botmaker') {
            await BotMaker.handleMessage(text, currentUser, db, this.sendBotMessage.bind(this));
            input.value = '';
            return;
        }

        if (this.currentChatType === 'support' || this.currentChatType === 'support_staff') {
            const supportId = this.currentChatId.replace('support_', '');
            const msg = {
                messageId: db.ref().push().key,
                senderId: currentUser.uid,
                text: text,
                timestamp: Date.now()
            };
            await db.ref(`support/${supportId}/messages/${msg.messageId}`).set(msg);
            input.value = '';
            return;
        }

        if (this.currentChatType === 'private') {
            const msg = {
                messageId: db.ref().push().key,
                senderId: currentUser.uid,
                receiverId: this.currentChatUser.uid,
                text,
                timestamp: Date.now()
            };
            if (this.replyToMessage) msg.replyTo = this.replyToMessage.text;
            await db.ref(`messages/${this.currentChatId}/${msg.messageId}`).set(msg);
        } else {
            const groupId = this.currentChatId.replace('group_', '');
            const groupSnap = await db.ref(`groups/${groupId}`).once('value');
            const group = groupSnap.val();
            
            if (group.type === 'channel' && group.createdBy !== currentUser.uid) {
                alert('فقط المالك يمكنه النشر في القناة');
                input.value = '';
                return;
            }

            const msg = {
                messageId: db.ref().push().key,
                senderId: currentUser.uid,
                groupId,
                text,
                timestamp: Date.now()
            };
            if (this.replyToMessage) msg.replyTo = this.replyToMessage.text;
            await db.ref(`groupMessages/${groupId}/${msg.messageId}`).set(msg);
        }
        this.clearReply();
        input.value = '';
    },

    async sendBotMessage(senderId, text) {
        const botMsg = {
            messageId: db.ref().push().key,
            senderId: senderId,
            receiverId: currentUser.uid,
            text: text,
            timestamp: Date.now()
        };
        const path = senderId === 'ttdbot' ? `bot_${currentUser.uid}` : `botmaker_${currentUser.uid}`;
        await db.ref(`messages/${path}/${botMsg.messageId}`).set(botMsg);

        const container = document.getElementById('messagesContainer');
        const div = document.createElement('div');
        div.className = 'message received bot-message';
        div.innerHTML = `<div>${window.linkify ? window.linkify(text) : text}</div><div class="message-time">${new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    banUser() { alert('خاصية الحظر قيد التطوير'); },
    showMentionSuggestions() { alert('خاصية الإشارة قيد التطوير'); },
    insertMention(username) {},
    toggleSearchInChat() {
        const bar = document.getElementById('searchChatBar');
        bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    },
    async searchInChat() {
        const query = document.getElementById('searchChatInput').value.trim().toLowerCase();
        if (!query || !this.currentChatId) return;
        alert('خاصية البحث داخل المحادثة قيد التطوير');
    }
};

const Channel = {
    open() {
        alert('قناة المطور: سيتم فتحها قريباً');
    }
};

function loadChatList() {
    if (chatListListener) chatListListener.off();
    
    const uid = currentUser.uid;
    const conversations = new Map();

    // إضافة البوتات الثابتة
    conversations.set('ttdbot', {
        id: 'ttdbot',
        type: 'bot',
        lastMessage: 'بوت إنشاء البوتات',
        timestamp: Date.now(),
        isStatic: true
    });
    conversations.set('botmaker', {
        id: 'botmaker',
        type: 'botmaker',
        lastMessage: 'صانع البوتات المتقدم',
        timestamp: Date.now(),
        isStatic: true
    });

    chatListListener = db.ref('messages').on('value', (snapshot) => {
        snapshot.forEach(chatSnap => {
            const msgs = chatSnap.val();
            if (msgs && typeof msgs === 'object') {
                Object.values(msgs).forEach(msg => {
                    if (msg.senderId === uid || msg.receiverId === uid) {
                        const otherId = msg.senderId === uid ? msg.receiverId : msg.senderId;
                        const existing = conversations.get(otherId);
                        if (!existing || existing.timestamp < msg.timestamp) {
                            conversations.set(otherId, {
                                id: otherId,
                                type: 'user',
                                lastMessage: msg.text,
                                timestamp: msg.timestamp,
                                isStatic: false
                            });
                        }
                    }
                });
            }
        });

        db.ref('groupMembers').orderByChild('uid').equalTo(uid).once('value', (memberSnap) => {
            memberSnap.forEach(member => {
                const groupId = member.key;
                db.ref(`groupMessages/${groupId}`).orderByChild('timestamp').limitToLast(1).once('value', (msgSnap) => {
                    let lastMsg = 'أنشئت حديثاً', lastTime = Date.now();
                    msgSnap.forEach(m => {
                        lastMsg = m.val().text;
                        lastTime = m.val().timestamp;
                    });
                    const groupKey = `group_${groupId}`;
                    conversations.set(groupKey, {
                        id: groupId,
                        type: 'group',
                        lastMessage: lastMsg,
                        timestamp: lastTime,
                        isStatic: false
                    });
                    renderChatList(Array.from(conversations.values()));
                });
            });
        });

        renderChatList(Array.from(conversations.values()));
    });
}

async function renderChatList(list) {
    const container = document.getElementById('chatListContainer');
    if (!container) return;
    
    list.sort((a, b) => b.timestamp - a.timestamp);

    let html = '';
    for (let item of list) {
        if (item.type === 'user') {
            const userSnap = await db.ref('users').orderByChild('uid').equalTo(item.id).once('value');
            if (!userSnap.exists()) continue;
            let user;
            userSnap.forEach(u => user = u.val());

            const statusSnap = await db.ref(`status/${user.uid}`).once('value');
            const status = statusSnap.val();
            const isOnline = status && status.state === 'online';

            html += `
                <div class="chat-list-item" onclick="Chat.startPrivate('${user.uid}', '${user.username}', '${user.fullName}')">
                    <div class="chat-avatar" style="position:relative;">
                        ${user.photoURL ? `<img src="${user.photoURL}">` : user.fullName.charAt(0)}
                        <span class="${isOnline ? 'online-indicator' : 'offline-indicator'}"></span>
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">
                            <span>${user.fullName}</span>
                            <span class="chat-time">${new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="chat-last-msg">${item.lastMessage}</div>
                    </div>
                </div>
            `;
        } else if (item.type === 'group') {
            const groupSnap = await db.ref(`groups/${item.id}`).once('value');
            const group = groupSnap.val();
            if (!group) continue;
            html += `
                <div class="chat-list-item" onclick="GroupsAndChannels.open('${group.id}')">
                    <div class="chat-avatar" style="border-radius:${group.type === 'channel' ? '8px' : '50%'};">${group.type === 'channel' ? '📢' : '👥'}</div>
                    <div class="chat-info">
                        <div class="chat-name">
                            <span>${group.name}</span>
                            <span class="chat-time">${new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="chat-last-msg">${item.lastMessage}</div>
                    </div>
                </div>
            `;
        } else if (item.type === 'bot') {
            html += `
                <div class="chat-list-item" onclick="Chat.startPrivate('ttdbot', 'ttdbot', 'TTDBOT')">
                    <div class="chat-avatar" style="background:#2196f3;">🤖</div>
                    <div class="chat-info">
                        <div class="chat-name">
                            <span>TTDBOT <span class="verified-badge">موثق</span></span>
                            <span class="chat-time"></span>
                        </div>
                        <div class="chat-last-msg">${item.lastMessage}</div>
                    </div>
                </div>
            `;
        } else if (item.type === 'botmaker') {
            html += `
                <div class="chat-list-item" onclick="Chat.startPrivate('botmaker', 'botmaker', 'BotMaker')">
                    <div class="chat-avatar" style="background:#9c27b0;">🤖</div>
                    <div class="chat-info">
                        <div class="chat-name">
                            <span>BotMaker <span style="background:#9c27b0; color:white; padding:2px 6px; border-radius:12px;">صانع البوتات</span></span>
                            <span class="chat-time"></span>
                        </div>
                        <div class="chat-last-msg">${item.lastMessage}</div>
                    </div>
                </div>
            `;
        }
    }

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">لا توجد محادثات بعد</div>';
    } else {
        container.innerHTML = html;
    }
}

window.Chat = Chat;
window.Channel = Channel;
window.loadChatList = loadChatList;
