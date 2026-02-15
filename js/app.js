let currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) { window.location.href = 'index.html'; }

const UI = {
    toggleDrawer() {
        document.getElementById('drawer').classList.toggle('open');
        document.getElementById('drawerOverlay').classList.toggle('open');
    },
    closeDrawer() {
        document.getElementById('drawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('open');
    },
    toggleSearch() { document.getElementById('searchBar').classList.toggle('show'); },
    openCreateModal() { document.getElementById('createModal').classList.add('open'); },
    closeCreateModal() { document.getElementById('createModal').classList.remove('open'); },
    openCountersMenu() { document.getElementById('countersMenu').classList.add('open'); },
    closeCountersMenu() { document.getElementById('countersMenu').classList.remove('open'); },
    countersAction(action) { alert(action); this.closeCountersMenu(); },
    showSettings(type) { if (type === 'counters') this.openCountersMenu(); else alert(type); this.closeDrawer(); },
    editName() { alert('تعديل الاسم'); this.closeDrawer(); },
    editUsername() { alert('تعديل اسم المستخدم'); this.closeDrawer(); },
    toggleDarkMode() { document.body.classList.toggle('dark-mode'); this.closeDrawer(); },
    changePhoto() { alert('تغيير الصورة'); },
    updateDrawerInfo() { if (currentUser) { document.getElementById('drawerFullName').innerText = currentUser.fullName; document.getElementById('drawerUsername').innerText = '@' + currentUser.username; } },
    closeProfile() { document.getElementById('profileModal')?.classList.remove('open'); }
};

const Auth = { logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; } };
const Channel = { open() { alert('قناة المطور'); } };
alert('✅ تم تحميل app.js بنجاح');

UI.updateDrawerInfo();


