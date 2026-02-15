// ==================== groups.js ====================
const GroupsAndChannels = {
    async create() {
        const name = document.getElementById('createName').value.trim();
        let username = document.getElementById('createUsername').value.trim().replace('@', '');
        const type = document.getElementById('createType').value;
        const errorDiv = document.getElementById('createError');

        if (!name || !username) { errorDiv.innerText = 'الرجاء إدخال الاسم واسم المستخدم'; return; }
        if (!/^[A-Za-z][A-Za-z0-9_]{4,19}$/.test(username)) { errorDiv.innerText = 'اسم المستخدم: 5-20 حرف، يبدأ بحرف'; return; }

        const check = await db.ref('usernames').child(username).once('value');
        if (check.exists()) { errorDiv.innerText = 'اسم المستخدم مستخدم بالفعل'; return; }

        const groupId = db.ref().push().key;
        const groupData = { id: groupId, name, username, type, createdBy: currentUser.uid, createdAt: Date.now(), memberCount: 1 };
        await db.ref(`groups/${groupId}`).set(groupData);
        await db.ref(`usernames/${username}`).set(groupId);
        await db.ref(`groupMembers/${groupId}/${currentUser.uid}`).set({ role: 'owner', joinedAt: Date.now() });

        UI.closeCreateModal();
        this.open(groupId);
    },

    async open(groupId) {
        const groupSnap = await db.ref(`groups/${groupId}`).once('value');
        const group = groupSnap.val();
        if (!group) return;
        Chat.currentChatType = group.type;
        Chat.currentChatId = `group_${groupId}`;
        Chat.currentChatGroup = group;
        Chat.openChatUI(group.name, group.type === 'channel' ? '📢' : '👥', `${group.type} · ${group.memberCount} عضو`);
        Chat.loadGroupMessages(groupId);
    }
};
window.GroupsAndChannels = GroupsAndChannels;
