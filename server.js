const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Statik dosyaları sunmak için
app.use(express.static('./'));

// Ana sayfayı yönlendir
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin sayfası yönlendirmesi
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Panel sayfası yönlendirmesi
app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// Diğer tüm istekleri index.html'e yönlendir (SPA için)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor!`);
}); 