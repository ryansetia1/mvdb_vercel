# Violentmonkey Scripts untuk MVDB

## 📁 File Script yang Tersedia

### 🔧 **Script Utama:**

**`javdb-gender-fix-v2.user.js`** - MVDB Data Extractor untuk JavDB
   - ✅ Deteksi gender yang akurat (♀ untuk aktris, ♂ untuk aktor)
   - ✅ Format kompatibel dengan MVDB Parser
   - ✅ Visual feedback tanpa alert yang mengganggu
   - ✅ Tombol berubah menjadi "✅ Copied!" saat berhasil
   - ✅ Desain tombol yang menarik dengan gradient dan efek hover

## 🚀 Cara Instalasi

### **Step 1: Install Violentmonkey**
1. **Chrome**: [Violentmonkey Extension](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
2. **Firefox**: [Violentmonkey Add-on](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
3. **Edge**: [Violentmonkey Extension](https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao)

### **Step 2: Install Script**

#### **MVDB Data Extractor untuk JavDB**
1. Buka Violentmonkey Dashboard
2. Klik "Create a new script"
3. Copy seluruh isi file `javdb-gender-fix-v2.user.js`
4. Paste ke editor Violentmonkey
5. Save script (Ctrl+S)

### **Step 3: Aktifkan Script**
1. Pastikan script aktif di Violentmonkey Dashboard
2. Script akan otomatis aktif di halaman javdb.com

## 🎯 Cara Penggunaan

### **Workflow Lengkap:**

1. **Buka halaman film di javdb.com**
   ```
   https://javdb.com/v/[ID]
   ```

2. **Klik tombol "🎬 Copy to MVDB"**
   - Tombol akan muncul di pojok kanan atas dengan desain gradient yang menarik
   - Tombol akan berubah menjadi "✅ Copied!" saat berhasil
   - Data akan tersalin ke clipboard

3. **Buka aplikasi MVDB**
   - Pergi ke Admin Panel > Parser

4. **Klik tombol "📋 Paste from Clipboard"** (fitur in-app)
   - Tombol akan muncul di bawah textarea
   - Data akan otomatis ter-paste ke textarea
   - Tombol akan berubah menjadi "✅ Pasted!" saat berhasil

5. **Klik "Parse Data"**
   - Data akan berhasil diparse tanpa error

## ✅ Fitur yang Tersedia

### **MVDB Data Extractor untuk JavDB:**
- ✅ Deteksi gender yang akurat (♀ untuk aktris, ♂ untuk aktor)
- ✅ Format kompatibel dengan MVDB Parser
- ✅ Visual feedback tanpa alert yang mengganggu
- ✅ Copy otomatis ke clipboard
- ✅ Debug info di console
- ✅ Desain tombol yang menarik dengan gradient biru-ungu
- ✅ Efek hover yang smooth dengan transform dan shadow
- ✅ Typography modern dengan font system dan letter-spacing

## 📊 Contoh Output

### **Data yang Diekstrak:**
```
STARS-080 尻フェチspecial！！バック膣奥激ピストンからのアナル丸見せまくりで何度もイッちゃうってばぁあ！ 小倉由菜
Released Date: 2019-07-11
Duration: 138 minute(s)
Director: うさぴょん。
Maker: SOD Create
Actor(s): 小倉由菜♀ 玉木玲♂ マッスル澤野♂ 黒田悠斗♂ 吉村卓♂
Tags: Solowork, Butt, Cosplayers, Beautiful Girl Movie, Amateur, Uncensored Leak
```

### **Hasil di Parser:**
- **Code:** STARS-080
- **Title:** 尻フェチspecial！！バック膣奥激ピストンからのアナル丸見せまくりで何度もイッちゃうってばぁあ！ 小倉由菜
- **Actresses:** 小倉由菜
- **Actors:** 玉木玲, マッスル澤野, 黒田悠斗, 吉村卓

## 🐛 Troubleshooting

### **Script tidak muncul:**
1. Pastikan Violentmonkey aktif
2. Pastikan script enabled
3. Refresh halaman
4. Cek console browser untuk error

### **Gender detection salah:**
1. Pastikan menggunakan `javdb-gender-fix-v2.user.js`
2. Cek console untuk debug info
3. Pastikan halaman javdb.com sudah selesai dimuat

### **Paste button tidak muncul di MVDB:**
1. Pastikan berada di halaman MVDB Parser
2. Pastikan textarea sudah muncul
3. Refresh halaman dan coba lagi
4. Fitur paste sekarang sudah built-in di aplikasi MVDB

## 📝 Catatan Penting

- Script ini dioptimalkan untuk Violentmonkey
- Tidak ada alert yang mengganggu user flow
- Visual feedback melalui perubahan tombol
- Debug info tersedia di console browser
- Kompatibel dengan semua browser yang mendukung Violentmonkey

## 🆘 Support

Jika mengalami masalah:
1. Cek console browser (F12) untuk error
2. Pastikan Violentmonkey terinstall dengan benar
3. Test dengan halaman yang berbeda
4. Report dengan screenshot error jika perlu
