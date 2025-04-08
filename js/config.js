// Firebase projenizin yapılandırma bilgileri
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Firebase SDK'larını yüklemek için bu dosyayı kullanmayacağız,
// bunun yerine her ilgili JS dosyasında (app.js, auth.js, panel.js)
// doğrudan import edeceğiz. Bu değişkeni dışa aktarmak yeterli.
module.exports = { firebaseConfig };
