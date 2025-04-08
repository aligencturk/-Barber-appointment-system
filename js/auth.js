// Firebase'i başlat
// firebaseConfig değişkeni js/config.js dosyasından global scope'da geliyor.
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Firebase Authentication referansı

// DOM Elementleri
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');

// Form gönderildiğinde giriş yapmayı dene
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Formun varsayılan gönderimini engelle

    const email = emailInput.value;
    const password = passwordInput.value;

    // Hata mesajını temizle
    loginError.style.display = 'none';

    // Firebase ile giriş yapmayı dene
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Giriş başarılı, panel sayfasına yönlendir
            console.log("Giriş başarılı:", userCredential.user);
            window.location.href = 'panel.html'; // Panelin olduğu sayfaya yönlendir
        })
        .catch((error) => {
            // Giriş başarısız, hata mesajı göster
            console.error("Giriş hatası:", error);
            loginError.textContent = getFirebaseErrorMessage(error); // Daha anlaşılır hata mesajı
            loginError.style.display = 'block';
        });
});

// Firebase hata kodlarını daha kullanıcı dostu mesajlara çevirir (isteğe bağlı)
function getFirebaseErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Geçersiz e-posta formatı.';
        case 'auth/user-disabled':
            return 'Bu kullanıcı hesabı devre dışı bırakılmış.';
        case 'auth/user-not-found':
            return 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
        case 'auth/wrong-password':
            return 'Yanlış şifre girdiniz.';
        case 'auth/invalid-credential': // Yeni SDK versiyonlarında bu daha genel olabilir
             return 'E-posta veya şifre hatalı.';
        default:
            return 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

// Sayfa yüklendiğinde kullanıcı zaten giriş yapmışsa panele yönlendir (isteğe bağlı)
auth.onAuthStateChanged(user => {
    if (user) {
        // Kullanıcı zaten giriş yapmış, doğrudan panele yönlendir
        // Bu, tarayıcı sekmesi kapatılıp açıldığında tekrar giriş yapmayı önler.
        console.log("Kullanıcı zaten giriş yapmış, panele yönlendiriliyor.");
        // Eğer admin.html'de isek ve giriş yapılmışsa panele git
        if (window.location.pathname.endsWith('admin.html')) {
             window.location.href = 'panel.html';
        }
    }
});
