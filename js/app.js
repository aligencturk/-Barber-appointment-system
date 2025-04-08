// Firebase'i başlat
// firebaseConfig değişkeni js/config.js dosyasından global scope'da geliyor.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Firestore veritabanı referansı

// DOM Elementleri
const hizliRandevuBtn = document.getElementById('hizliRandevuBtn');
const randevuForm = document.getElementById('randevuForm');
const tarihInput = document.getElementById('tarih');
const saatSelect = document.getElementById('saat');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// --- Olay Dinleyicileri ---

// "Hızlı Randevu Al" butonu tıklanınca formu göster/gizle
hizliRandevuBtn.addEventListener('click', () => {
    if (randevuForm.style.display === 'none' || randevuForm.style.display === '') {
        randevuForm.style.display = 'block';
        hizliRandevuBtn.textContent = 'Formu Gizle'; // Buton metnini değiştir
    } else {
        randevuForm.style.display = 'none';
        hizliRandevuBtn.textContent = 'Hızlı Randevu Al'; // Buton metnini eski haline getir
    }
});

// Tarih seçildiğinde saatleri güncelle
tarihInput.addEventListener('change', async () => {
    const secilenTarih = tarihInput.value;
    if (!secilenTarih) {
        saatSelect.innerHTML = '<option value="">Önce tarih seçiniz...</option>';
        saatSelect.disabled = true;
        return;
    }

    // Geçmiş bir tarih seçilmesini engelle (isteğe bağlı ama önerilir)
    const bugun = new Date().toISOString().split('T')[0];
    if (secilenTarih < bugun) {
        alert("Geçmiş bir tarih için randevu alamazsınız.");
        tarihInput.value = ''; // Tarih seçimini temizle
        saatSelect.innerHTML = '<option value="">Önce tarih seçiniz...</option>';
        saatSelect.disabled = true;
        return;
    }


    saatSelect.disabled = true; // Saatler yüklenirken deaktif et
    saatSelect.innerHTML = '<option value="">Saatler yükleniyor...</option>';

    try {
        const musaitSaatler = await getMusaitSaatler(secilenTarih);

        saatSelect.innerHTML = '<option value="">Saat seçiniz...</option>'; // Başlangıç seçeneği
        if (musaitSaatler.length === 0) {
             saatSelect.innerHTML = '<option value="">Uygun saat bulunamadı.</option>';
             saatSelect.disabled = true;
        } else {
            musaitSaatler.forEach(saat => {
                const option = document.createElement('option');
                option.value = saat;
                option.textContent = saat;
                saatSelect.appendChild(option);
            });
            saatSelect.disabled = false; // Saatler yüklendi, aktif et
        }
    } catch (error) {
        console.error("Saatler getirilirken hata oluştu:", error);
        saatSelect.innerHTML = '<option value="">Hata oluştu</option>';
        saatSelect.disabled = true;
        errorMessage.textContent = "Müsait saatler getirilirken bir sorun oluştu.";
        errorMessage.style.display = 'block';
        setTimeout(() => errorMessage.style.display = 'none', 5000); // 5 saniye sonra hata mesajını gizle
    }
});

// Form gönderildiğinde randevuyu kaydet
randevuForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Formun varsayılan gönderimini engelle

    // Form verilerini al
    const ad = document.getElementById('ad').value.trim();
    const telefon = document.getElementById('telefon').value.trim();
    const hizmet = document.getElementById('hizmet').value;
    const tarih = tarihInput.value;
    const saat = saatSelect.value;

    // Basit doğrulama
    if (!ad || !telefon || !hizmet || !tarih || !saat) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    // Randevu verisini oluştur
    const randevuData = {
        ad: ad,
        telefon: telefon,
        hizmetTuru: hizmet,
        tarih: tarih,
        saat: saat,
        olusturulmaZamani: firebase.firestore.FieldValue.serverTimestamp() // Kayıt zamanı
    };

    try {
        // Firestore'a kaydet
        await db.collection('randevular').add(randevuData);

        // Başarı mesajı göster ve formu sıfırla
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        randevuForm.reset(); // Formu temizle
        saatSelect.innerHTML = '<option value="">Önce tarih seçiniz...</option>'; // Saat listesini sıfırla
        saatSelect.disabled = true; // Saat listesini deaktif et

        // Mesajı birkaç saniye sonra gizle
        setTimeout(() => {
            successMessage.style.display = 'none';
            // Formu da gizleyebiliriz
            // randevuForm.style.display = 'none';
            // hizliRandevuBtn.textContent = 'Hızlı Randevu Al';
        }, 5000);

    } catch (error) {
        console.error("Randevu kaydedilirken hata oluştu:", error);
        errorMessage.textContent = "Randevu kaydedilirken bir hata oluştu. Lütfen tekrar deneyin veya yönetici ile iletişime geçin.";
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        // Hata mesajını da gizleyebiliriz
        // setTimeout(() => errorMessage.style.display = 'none', 5000);
    }
});


// --- Yardımcı Fonksiyonlar ---

// Belirli bir tarih için müsait saatleri getirir
async function getMusaitSaatler(tarih) {
    // Çalışma saatleri (örnek: 09:00 - 17:30 arası, 30dk aralıklarla)
    const tumSaatler = [];
    for (let saat = 9; saat < 18; saat++) {
        tumSaatler.push(`${saat.toString().padStart(2, '0')}:00`);
        if (saat < 17) { // 17:30 son randevu saati olsun
             tumSaatler.push(`${saat.toString().padStart(2, '0')}:30`);
        }
    }
     // 17:30'u manuel ekleyelim (döngü 18'e kadar gitmediği için)
    tumSaatler.push('17:30');


    // Firestore'dan o günkü randevuları çek
    const snapshot = await db.collection('randevular').where('tarih', '==', tarih).get();
    const doluSaatler = snapshot.docs.map(doc => doc.data().saat);

    // Müsait saatleri filtrele
    const musaitSaatler = tumSaatler.filter(saat => !doluSaatler.includes(saat));

    return musaitSaatler;
}

// Sayfa yüklendiğinde tarih inputunun minimum değerini bugüne ayarla
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    tarihInput.setAttribute('min', today);
});
