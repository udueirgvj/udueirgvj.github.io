const Auth = { logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; } };
window.Auth = Auth;
