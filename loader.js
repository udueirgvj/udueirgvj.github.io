const files = [
    'js/firebase-config.js',
    'js/auth.js',
    'js/bots.js',
    'js/support.js',
    'js/groups.js',
    'js/chat.js',
    'js/app.js'
];

function loadScript(index) {
    if (index >= files.length) {
        console.log('✅ جميع الملفات حُمّلت');
        return;
    }
    const script = document.createElement('script');
    script.src = files[index];
    script.onload = () => {
        console.log(`✅ تم تحميل: ${files[index]}`);
        loadScript(index + 1);
    };
    script.onerror = () => {
        console.error(`❌ فشل تحميل: ${files[index]} (تأكد من وجوده في js/)`);
    };
    document.head.appendChild(script);
}
loadScript(0);
