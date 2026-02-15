// ==================== auth.js ====================
const Auth = {
    currentUser: null,

    isValidUsername(username) {
        return /^[A-Za-z][A-Za-z0-9_]{4,19}$/.test(username);
    },

    async isUsernameAvailable(username) {
        const snap = await db.ref('usernames').child(username).once('value');
        return !snap.exists();
    },

    async signUp(email, password, fullName, username) {
        if (!email || !password || !fullName || !username) throw new Error('جميع الحقول مطلوبة');
        if (!this.isValidUsername(username)) throw new Error('اسم المستخدم: 5-20 حرف، يبدأ بحرف');
        if (password.length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل');

        const available = await this.isUsernameAvailable(username);
        if (!available) throw new Error('اسم المستخدم غير متاح');

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.sendEmailVerification();

            const userData = {
                uid: user.uid, email, fullName, username,
                photoURL: '', bio: '', emailVerified: false,
                createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(),
                subscribedChannel: false
            };
            await db.ref(`users/${user.uid}`).set(userData);
            await db.ref(`usernames/${username}`).set(user.uid);
            await auth.signOut();
            return { success: true, message: 'تم إنشاء الحساب. الرجاء تفعيل البريد الإلكتروني', email };
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') throw new Error('البريد الإلكتروني مستخدم بالفعل');
            throw error;
        }
    },

    async login(email, password) {
        if (!email || !password) throw new Error('أدخل البريد الإلكتروني وكلمة المرور');

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            if (!user.emailVerified) throw new Error('الرجاء تفعيل البريد الإلكتروني أولاً');

            await db.ref(`users/${user.uid}/lastLogin`).set(new Date().toISOString());
            await db.ref(`users/${user.uid}/emailVerified`).set(true);
            const snapshot = await db.ref(`users/${user.uid}`).once('value');
            this.currentUser = snapshot.val();
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') throw new Error('البريد أو كلمة المرور غير صحيحة');
            throw error;
        }
    },

    async logout() {
        await auth.signOut();
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
};
window.Auth = Auth;
