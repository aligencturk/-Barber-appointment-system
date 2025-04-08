// Firebase'i başlat
// firebaseConfig değişkeni js/config.js dosyasından global scope'da geliyor.
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elementleri
const logoutBtn = document.getElementById('logoutBtn');
const randevuListesiBody = document.getElementById('randevuListesi');
const randevuListesiLoading = document.getElementById('randevuListesiLoading');
const randevuTablosu = document.getElementById('randevuTablosu');
const randevuYokMesaji = document.getElementById('randevuYokMesaji');
const bugunTarihSpan = document.getElementById('bugunTarih');
const calendarEl = document.getElementById('calendar');

let calendar; // Takvim nesnesini globalde tutalım

// --- Giriş Kontrolü ---
auth.onAuthStateChanged(user => {
    if (user) {
        // Kullanıcı giriş yapmış, panel içeriğini yükle
        console.log("Panel için kullanıcı girişi doğrulandı.");
        loadPanelData();
    } else {
        // Kullanıcı giriş yapmamış, giriş sayfasına yönlendir
        console.log("Kullanıcı giriş yapmamış, admin.html'e yönlendiriliyor.");
        window.location.href = 'admin.html';
    }
});

// --- Olay Dinleyicileri ---
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log("Çıkış başarılı.");
        window.location.href = 'admin.html';
    }).catch((error) => {
        console.error("Çıkış hatası:", error);
        alert("Çıkış yapılırken bir hata oluştu.");
    });
});

// --- Panel Veri Yükleme Fonksiyonları ---
async function loadPanelData() {
    // Bugünün tarihini al (YYYY-MM-DD formatında)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    bugunTarihSpan.textContent = formattedDate; // Başlığa bugünün tarihini yaz

    // 1. Günlük Randevuları Yükle
    loadGunlukRandevular(todayString);

    // 2. Takvimi Başlat ve Tüm Randevuları Yükle
    initializeCalendar();
    loadTumRandevular();
}

// Bugünün randevularını Firestore'dan çeker ve tabloya ekler
async function loadGunlukRandevular(tarihString) {
    randevuListesiLoading.style.display = 'block';
    randevuTablosu.style.display = 'none';
    randevuYokMesaji.style.display = 'none';
    randevuListesiBody.innerHTML = ''; // Önceki listeyi temizle

    try {
        const snapshot = await db.collection('randevular')
                                 .where('tarih', '==', tarihString)
                                 .orderBy('saat') // Saate göre sırala
                                 .get();

        if (snapshot.empty) {
            randevuYokMesaji.style.display = 'block';
        } else {
            snapshot.forEach(doc => {
                const randevu = doc.data();
                const row = randevuListesiBody.insertRow();
                row.innerHTML = `
                    <td>${randevu.saat}</td>
                    <td>${randevu.ad}</td>
                    <td>${randevu.telefon}</td>
                    <td>${formatHizmetAdi(randevu.hizmetTuru)}</td>
                    <!-- <td><button onclick="randevuSil('${doc.id}')">Sil</button></td> -->
                `;
            });
            randevuTablosu.style.display = 'table'; // Tabloyu göster
        }
    } catch (error) {
        console.error("Günlük randevular yüklenirken hata:", error);
        randevuYokMesaji.textContent = "Randevular yüklenirken bir hata oluştu.";
        randevuYokMesaji.style.display = 'block';
    } finally {
        randevuListesiLoading.style.display = 'none'; // Yükleniyor göstergesini gizle
    }
}

// FullCalendar'ı başlatır
function initializeCalendar() {
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Aylık görünümle başla
        locale: 'tr', // Türkçe dil
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay' // Farklı görünümler
        },
        events: [], // Başlangıçta boş, loadTumRandevular ile doldurulacak
        eventClick: function(info) {
            // Takvimdeki bir randevuya tıklandığında detayları göster (örnek)
            const r = info.event.extendedProps; // Randevu verisi
            alert(
                `Randevu Detayı:\n` +
                `Tarih: ${info.event.start.toLocaleDateString('tr-TR')}\n` +
                `Saat: ${r.saat}\n` +
                `Müşteri: ${r.ad}\n` +
                `Telefon: ${r.telefon}\n` +
                `Hizmet: ${formatHizmetAdi(r.hizmetTuru)}`
            );
        },
        dateClick: function(info) {
            // Takvimde boş bir güne tıklandığında o günün randevularını listele
            console.log('Tıklanan tarih: ', info.dateStr);
            document.getElementById('gunlukRandevuBaslik').textContent = `${info.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} Randevuları`;
            loadGunlukRandevular(info.dateStr); // Seçilen günün randevularını yükle
        }
        // İleride eklenebilecekler: eventDrop, eventResize vb.
    });

    calendar.render(); // Takvimi çiz
}

// Tüm randevuları Firestore'dan çeker ve takvime ekler
async function loadTumRandevular() {
    try {
        const snapshot = await db.collection('randevular').get();
        const events = snapshot.docs.map(doc => {
            const randevu = doc.data();
            // FullCalendar için event objesi oluştur
            return {
                id: doc.id,
                title: `${randevu.saat} - ${randevu.ad}`, // Takvimde görünecek başlık
                start: `${randevu.tarih}T${randevu.saat}`, // Başlangıç tarihi ve saati (ISO formatına yakın)
                // Bitiş saati eklemek istersek: end: ...,
                extendedProps: randevu // Orijinal randevu verisini sakla
            };
        });

        // Takvimdeki mevcut eventleri temizle ve yenilerini ekle
        calendar.removeAllEvents();
        calendar.addEventSource(events);

    } catch (error) {
        console.error("Tüm randevular takvime yüklenirken hata:", error);
        alert("Takvim randevuları yüklenirken bir hata oluştu.");
    }
}

// Hizmet kodunu okunabilir isme çevirir
function formatHizmetAdi(hizmetKodu) {
    switch (hizmetKodu) {
        case 'sac_kesim': return 'Saç Kesim';
        case 'sakal_tras': return 'Sakal Traşı';
        case 'sac_sakal': return 'Saç + Sakal';
        case 'yikama_fon': return 'Yıkama + Fön';
        default: return hizmetKodu; // Bilinmeyen kod varsa olduğu gibi göster
    }
}

// İleride randevu silme fonksiyonu eklenebilir
// function randevuSil(docId) {
//     if (confirm("Bu randevuyu silmek istediğinizden emin misiniz?")) {
//         db.collection('randevular').doc(docId).delete()
//             .then(() => {
//                 console.log("Randevu başarıyla silindi!");
//                 loadPanelData(); // Verileri yeniden yükle
//             })
//             .catch((error) => {
//                 console.error("Randevu silinirken hata:", error);
//                 alert("Randevu silinirken bir hata oluştu.");
//             });
//     }
// }
