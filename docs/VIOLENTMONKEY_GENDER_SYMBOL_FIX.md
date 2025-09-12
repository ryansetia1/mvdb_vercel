# ViolentMonkey Gender Symbol Fix

## Masalah
Script ViolentMonkey sebelumnya tidak mengcopy simbol gender (♀ dan ♂) saat mengekstrak data actor dari JavDB, sehingga menyebabkan parser MVDB tidak dapat membedakan antara actress dan actor dengan benar.

## Solusi
Script ViolentMonkey telah diperbaiki untuk mengekstrak simbol gender menggunakan tiga metode:

### Method 1: Next Sibling Text Node
- Mengecek text node setelah link actor untuk simbol gender
- Cocok untuk struktur HTML: `<a>Nama Actor</a>♀`

### Method 2: Parent Element Text Content
- Mengecek text content dari parent element setelah posisi link
- Cocok untuk struktur HTML yang lebih kompleks

### Method 3: Link Text Content
- Mengecek apakah simbol gender sudah ada dalam text link
- Fallback untuk kasus di mana simbol gender sudah termasuk dalam link

## Perubahan Kode

### Sebelum (V1.7):
```javascript
case 'Actor(s):':
    const actorLinks = value.querySelectorAll('a');
    data.actors = Array.from(actorLinks).map(a => a.textContent.trim());
    break;
```

### Sesudah (V1.8):
```javascript
case 'Actor(s):':
    // Extract actors with gender symbols using multiple methods
    const actorLinks = value.querySelectorAll('a');
    console.log('JavDB Movie Code Search: Extracting actors, found', actorLinks.length, 'actor links');
    
    data.actors = Array.from(actorLinks).map((a, index) => {
        // Get the text content of the link
        let actorName = a.textContent.trim();
        console.log(`JavDB Movie Code Search: Actor ${index + 1} - Original name: "${actorName}"`);
        
        // Method 1: Check next sibling text node for gender symbol
        const nextSibling = a.nextSibling;
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
            const textAfter = nextSibling.textContent.trim();
            console.log(`JavDB Movie Code Search: Actor ${index + 1} - Text after link: "${textAfter}"`);
            if (textAfter.includes('♀') || textAfter.includes('♂')) {
                const genderMatch = textAfter.match(/[♀♂]/);
                if (genderMatch) {
                    actorName += genderMatch[0];
                    console.log(`JavDB Movie Code Search: Actor ${index + 1} - Added gender symbol via Method 1: "${actorName}"`);
                }
            }
        }
        
        // Method 2: Check parent element's text content for gender symbol after the link
        if (!actorName.includes('♀') && !actorName.includes('♂')) {
            const parentText = a.parentElement.textContent;
            const linkIndex = parentText.indexOf(actorName);
            if (linkIndex !== -1) {
                const textAfterLink = parentText.substring(linkIndex + actorName.length).trim();
                console.log(`JavDB Movie Code Search: Actor ${index + 1} - Parent text after link: "${textAfterLink}"`);
                const genderMatch = textAfterLink.match(/^[♀♂]/);
                if (genderMatch) {
                    actorName += genderMatch[0];
                    console.log(`JavDB Movie Code Search: Actor ${index + 1} - Added gender symbol via Method 2: "${actorName}"`);
                }
            }
        }
        
        // Method 3: Check if gender symbol is already in the link text
        if (!actorName.includes('♀') && !actorName.includes('♂')) {
            // Look for gender symbol anywhere in the link's text content
            const genderInLink = actorName.match(/[♀♂]/);
            if (genderInLink) {
                console.log(`JavDB Movie Code Search: Actor ${index + 1} - Gender symbol already in link: "${actorName}"`);
            }
        }
        
        console.log(`JavDB Movie Code Search: Actor ${index + 1} - Final result: "${actorName}"`);
        return actorName;
    });
    
    console.log('JavDB Movie Code Search: Final actors array:', data.actors);
    break;
```

## Hasil
Sekarang script ViolentMonkey akan mengcopy data actor dengan simbol gender:

**Sebelum:**
```
Actor(s): 玉木くるみ 桃山凜 藤森里穂 イセドン内村
```

**Sesudah:**
```
Actor(s): 玉木くるみ♀ 桃山凜♀ 藤森里穂♀ イセドン内村♂
```

## Testing
Untuk test script yang sudah diperbaiki:
1. Update script ViolentMonkey ke versi 1.8
2. Buka halaman detail movie di JavDB
3. Klik tombol "📋 MVDB COPIER"
4. Paste data ke MVDB parser
5. Verifikasi bahwa actress dan actor terdeteksi dengan benar

## Logging
Script sekarang memiliki logging detail untuk debugging:
- Jumlah actor links yang ditemukan
- Nama original setiap actor
- Text setelah link untuk setiap actor
- Method yang berhasil menambahkan simbol gender
- Hasil final untuk setiap actor
- Array actor final

Log dapat dilihat di browser console (F12 → Console).
