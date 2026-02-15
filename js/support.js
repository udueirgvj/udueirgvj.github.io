// ==================== support.js ====================
const SUPPORT_USERNAME = 'volunteer support';
const SUPPORT_UID = 'support_team';

const Support = {
    async startSupportChat() {
        Chat.currentChatType = 'support';
        Chat.currentChatId = `support_${currentUser.uid}`;
        Chat.currentChatUser = { uid: SUPPORT_UID, username: SUPPORT_USERNAME, fullName: 'فريق الدعم' };
        Chat.openChatUI('فريق الدعم', '🎧', '🟢 متصل');
        const messagesRef = db.ref(`support/${currentUser.uid}/messages`);
        Chat.messagesListener = messagesRef.orderByChild('timestamp').on('value', (snap) => this.displayMessages(snap));
        const welcomeMsg = { messageId: db.ref().push().key, senderId: 'system', text: '👋 مرحباً بك في دعم تلرفيب! سيتم الرد عليك في أقرب وقت.', timestamp: Date.now(), system: true };
        await messagesRef.child(welcomeMsg.messageId).set(welcomeMsg);
    },

    displayMessages(snapshot) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        if (!snapshot.exists()) { container.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">أرسل رسالتك الأولى للدعم</div>'; return; }
        const messages = [];
        snapshot.forEach(child => messages.push(child.val()));
        messages.sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            const div = document.createElement('div');
            if (msg.system) { div.className = 'message received support-message'; div.innerHTML = `<div>📢 ${msg.text}</div><div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</div>`; }
            else {
                div.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
                if (msg.senderId === SUPPORT_UID) div.classList.add('support-message');
                div.innerHTML = `<div>${msg.text}</div><div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</div>`;
            }
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    },

    async openSupportPanel() {
        document.getElementById('supportPanel').classList.add('open');
        await this.loadSupportConversations();
    },

    closeSupportPanel() { document.getElementById('supportPanel').classList.remove('open'); },

    async loadSupportConversations() {
        const list = document.getElementById('supportConversationsList');
        list.innerHTML = '<div style="padding:20px; text-align:center;">جاري التحميل...</div>';
        const usersSnap = await db.ref('users').once('value');
        let html = '';
        for (let child of Object.values(usersSnap.val() || {})) {
            const user = child;
            if (user.uid === currentUser.uid || user.username === SUPPORT_USERNAME) continue;
            const msgsSnap = await db.ref(`support/${user.uid}/messages`).once('value');
            if (msgsSnap.exists()) {
                let lastMsg = '', lastTime = 0;
                msgsSnap.forEach(msg => { if (msg.val().timestamp > lastTime) { lastMsg = msg.val().text; lastTime = msg.val().timestamp; } });
                html += `<div class="support-conversation-item" onclick="Support.openSupportChat('${user.uid}', '${user.fullName}', '${user.username}')"><div class="chat-avatar">${user.fullName.charAt(0)}</div><div style="flex:1;"><div><strong>${user.fullName}</strong> @${user.username}</div><div style="color:#666; font-size:13px;">${lastMsg.substring(0, 30)}...</div></div></div>`;
            }
        }
        list.innerHTML = html || '<div style="padding:20px; text-align:center;">لا توجد محادثات دعم</div>';
    },

    async openSupportChat(uid, fullName, username) {
        this.closeSupportPanel();
        Chat.currentChatType = 'support_staff';
        Chat.currentChatId = `support_${uid}`;
        Chat.currentChatUser = { uid, username, fullName };
        Chat.openChatUI(fullName, fullName.charAt(0), '🟢 متصل');
        const messagesRef = db.ref(`support/${uid}/messages`);
        Chat.messagesListener = messagesRef.orderByChild('timestamp').on('value', (snap) => this.displaySupportMessages(snap));
    },

    displaySupportMessages(snapshot) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        if (!snapshot.exists()) { container.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">لا توجد رسائل بعد</div>'; return; }
        const messages = [];
        snapshot.forEach(child => messages.push(child.val()));
        messages.sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            const div = document.createElement('div');
            if (msg.system) div.className = 'message received support-message';
            else {
                div.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
                if (msg.senderId === SUPPORT_UID) div.classList.add('support-message');
            }
            div.innerHTML = `<div>${msg.text}</div><div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</div>`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }
};
window.Support = Support;
