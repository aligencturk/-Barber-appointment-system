// Firebase projenizin yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyAVoJ2q9FLmzbJS2ZXxTu-qOSD9fpT29xM",
  authDomain: "barber-appointment-syste-b3123.firebaseapp.com",
  projectId: "barber-appointment-syste-b3123",
  storageBucket: "barber-appointment-syste-b3123.firebasestorage.app", // .appspot.com olmalı, ancak kullanıcıdan gelen bu şekilde, şimdilik böyle bırakıyorum. Sorun olursa düzeltiriz.
  messagingSenderId: "5583942395",
  appId: "1:5583942395:web:32710707a77b6391fa765e"
};

// Firebase SDK'larını yüklemek için bu dosyayı kullanmayacağız,
// bunun yerine her ilgili JS dosyasında (app.js, auth.js, panel.js)
// doğrudan import edeceğiz. Bu değişkeni dışa aktarmak yeterli.
// export { firebaseConfig }; // ES Module formatı için bu şekilde olurdu, ancak şimdilik global scope'da bırakalım.
