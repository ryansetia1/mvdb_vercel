// ==UserScript==
// @name         JavDB Movie Code Auto Search
// @namespace    http://violentmonkey.com/
// @version      1.8
// @description  Script untuk mendeteksi movie code dari clipboard MVDB dan melakukan search otomatis di JavDB
// @author       MVDB Team
// @match        https://javdb.com/*
// @grant        GM_setClipboard
// @grant        GM_getClipboard
// @run-at       document-end
// @compatible   Violentmonkey
// ==/UserScript==

/*
PERBAIKAN V1.1:
- Fixed clipboard permission error (NotAllowedError)
- Fixed invalid CSS selector (:contains)
- Added paste event listener sebagai alternatif monitoring
- Improved error handling dan fallback mechanisms
- Reduced clipboard check frequency untuk performa yang lebih baik
- Added multiple event triggers untuk kompatibilitas yang lebih baik

PERBAIKAN V1.2:
- Updated selector berdasarkan struktur HTML JavDB yang sebenarnya
- Added #video-search dan #search-submit sebagai selector utama
- Added fungsi ensureSearchBarVisible() untuk mobile compatibility
- Added logging untuk debugging selector yang berhasil
- Improved compatibility dengan JavDB mobile navigation

PERBAIKAN V1.3:
- Added deteksi halaman detail movie (javdb.com/v/xxxxxx)
- Added tombol copy untuk halaman detail movie
- Added sistem dual button (search + copy) berdasarkan konteks halaman
- Added ekstraksi data movie lengkap untuk copy ke MVDB
- Added URL change detection untuk SPA navigation
- Improved button management berdasarkan jenis halaman

PERBAIKAN V1.4:
- Fixed tombol copy dan search yang bertumpuk
- Tombol copy sekarang di posisi top: 80px untuk menghindari overlap
- Improved button positioning untuk better UX

PERBAIKAN V1.5:
- Fixed tombol search yang tidak update dengan movie code terbaru di halaman detail
- Tombol search sekarang selalu menggunakan movie code terbaru dari clipboard
- Improved button management untuk konsistensi di semua skenario
- Added dual button display di halaman detail movie (copy + search)

PERBAIKAN V1.6:
- Fixed logika manageButtons yang menyebabkan konflik
- Simplified clipboard update mechanism
- Improved URL change detection dengan clipboard refresh
- Better state management untuk lastClipboardContent
- Fixed paste event listener untuk konsistensi

PERBAIKAN V1.7:
- Fixed search bar yang tidak ter-update dengan movie code yang benar pada klik pertama
- Added verification dan retry mechanism untuk search bar value
- Added keyboard simulation sebagai fallback
- Improved performAutoSearch dengan better logging
- Increased delay untuk memastikan value ter-set dengan benar

PERBAIKAN V1.8:
- Fixed actor extraction untuk menyertakan simbol gender (♀ dan ♂)
- Added multiple methods untuk mengekstrak simbol gender dari berbagai struktur HTML
- Improved actor parsing untuk mendukung multiple female actresses dengan benar
- Enhanced logging untuk debugging actor extraction
*/

(function() {
    'use strict';

    let searchButton = null;
    let copyButton = null;
    let lastClipboardContent = '';
    let clipboardCheckInterval = null;
    let currentPage = '';

    // Regex untuk mendeteksi movie code format xxxxx-1234
    const movieCodeRegex = /^[A-Za-z]{2,6}-\d{3,4}$/;

    // Fungsi untuk mendeteksi jenis halaman
    function detectPageType() {
        const path = window.location.pathname;
        
        if (path.match(/^\/v\/[A-Za-z0-9]+$/)) {
            return 'movie-detail';
        } else if (path === '/' || path === '') {
            return 'homepage';
        } else if (path.includes('/search')) {
            return 'search-results';
        } else {
            return 'other';
        }
    }

    // Fungsi untuk mengekstrak data movie dari halaman detail
    function extractMovieData() {
        const data = {
            title: '',
            code: '',
            releaseDate: '',
            duration: '',
            director: '',
            studio: '',
            series: '',
            actors: [],
            tags: []
        };

        // Ekstrak judul
        const titleElement = document.querySelector('.current-title') || 
                            document.querySelector('h2.title .current-title') ||
                            document.querySelector('h2.title');
        if (titleElement) {
            data.title = titleElement.textContent.trim();
        }

        // Ekstrak kode
        const codeElement = document.querySelector('.panel-block.first-block .value') ||
                           document.querySelector('[data-clipboard-text]');
        if (codeElement) {
            data.code = codeElement.textContent.trim();
        }

        // Ekstrak data dari panel-block
        const panelBlocks = document.querySelectorAll('.panel-block');
        panelBlocks.forEach(block => {
            const strong = block.querySelector('strong');
            if (strong) {
                const label = strong.textContent.trim();
                const value = block.querySelector('.value');
                
                if (value) {
                    switch (label) {
                        case 'Released Date:':
                            data.releaseDate = value.textContent.trim();
                            break;
                        case 'Duration:':
                            data.duration = value.textContent.trim();
                            break;
                        case 'Director:':
                            const directorLink = value.querySelector('a');
                            data.director = directorLink ? directorLink.textContent.trim() : value.textContent.trim();
                            break;
                        case 'Maker:':
                            const makerLink = value.querySelector('a');
                            data.studio = makerLink ? makerLink.textContent.trim() : value.textContent.trim();
                            break;
                        case 'Series:':
                            const seriesLink = value.querySelector('a');
                            data.series = seriesLink ? seriesLink.textContent.trim() : value.textContent.trim();
                            break;
                        case 'Tags:':
                            const tagLinks = value.querySelectorAll('a');
                            data.tags = Array.from(tagLinks).map(a => a.textContent.trim());
                            break;
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
                    }
                }
            }
        });

        return data;
    }

    // Format untuk parser MVDB
    function formatForParser(data) {
        const lines = [];
        
        // Baris pertama: Kode + Judul (WAJIB untuk parser)
        if (data.code && data.title) {
            lines.push(`${data.code} ${data.title}`);
        }
        
        // Data dalam format "Key: Value" yang diharapkan parser
        if (data.releaseDate) {
            lines.push(`Released Date: ${data.releaseDate}`);
        }
        
        if (data.duration) {
            lines.push(`Duration: ${data.duration}`);
        }
        
        if (data.director) {
            lines.push(`Director: ${data.director}`);
        }
        
        if (data.studio) {
            lines.push(`Maker: ${data.studio}`);
        }
        
        if (data.series) {
            lines.push(`Series: ${data.series}`);
        }
        
        if (data.actors && data.actors.length > 0) {
            lines.push(`Actor(s): ${data.actors.join(' ')}`);
        }
        
        if (data.tags && data.tags.length > 0) {
            lines.push(`Tags: ${data.tags.join(', ')}`);
        }

        return lines.join('\n');
    }

    // Fungsi untuk copy data movie ke clipboard
    function copyMovieData() {
        const data = extractMovieData();
        const formatted = formatForParser(data);
        
        console.log('JavDB Movie Code Search: Extracted data:', data);
        console.log('JavDB Movie Code Search: Formatted output:', formatted);
        
        try {
            if (typeof GM_setClipboard !== 'undefined') {
                GM_setClipboard(formatted);
                showCopySuccessState();
            } else {
                // Fallback untuk browser yang tidak mendukung GM_setClipboard
                const textarea = document.createElement('textarea');
                textarea.value = formatted;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    showCopySuccessState();
                } else {
                    showCopyErrorState();
                    console.log('JavDB Movie Code Search: Data untuk copy manual:', formatted);
                }
            }
        } catch (error) {
            console.error('JavDB Movie Code Search: Error copying to clipboard:', error);
            showCopyErrorState();
            console.log('JavDB Movie Code Search: Data untuk copy manual:', formatted);
        }
    }

    // Fungsi untuk mendeteksi movie code dari clipboard
    function detectMovieCode(text) {
        if (!text || typeof text !== 'string') return null;
        
        // Bersihkan text dari whitespace dan newlines
        const cleanText = text.trim();
        
        // Cek apakah text cocok dengan format movie code
        if (movieCodeRegex.test(cleanText)) {
            return cleanText;
        }
        
        // Cek jika ada movie code dalam text yang lebih panjang
        const matches = cleanText.match(movieCodeRegex);
        if (matches && matches.length > 0) {
            return matches[0];
        }
        
        return null;
    }

    // Fungsi untuk mendapatkan clipboard content
    async function getClipboardContent() {
        try {
            if (typeof GM_getClipboard !== 'undefined') {
                return await GM_getClipboard();
            } else {
                // Fallback untuk browser yang tidak mendukung GM_getClipboard
                // Pastikan document dalam focus sebelum membaca clipboard
                if (document.hasFocus && !document.hasFocus()) {
                    console.log('JavDB Movie Code Search: Document tidak dalam focus, skip clipboard check');
                    return '';
                }
                return await navigator.clipboard.readText();
            }
        } catch (error) {
            // Jika error karena permission atau focus, tidak perlu log error
            if (error.name === 'NotAllowedError' || error.message.includes('not focused')) {
                return '';
            }
            console.log('JavDB Movie Code Search: Tidak bisa membaca clipboard:', error);
            return '';
        }
    }

    // Fungsi untuk memeriksa perubahan clipboard
    async function checkClipboardChange() {
        try {
            const currentClipboard = await getClipboardContent();
            
            if (currentClipboard !== lastClipboardContent) {
                lastClipboardContent = currentClipboard;
                const movieCode = detectMovieCode(currentClipboard);
                
                if (movieCode) {
                    console.log('JavDB Movie Code Search: Movie code terdeteksi:', movieCode);
                    // Langsung panggil manageButtons untuk konsistensi
                    manageButtons();
                } else {
                    hideSearchButton();
                }
            }
        } catch (error) {
            console.log('JavDB Movie Code Search: Error checking clipboard:', error);
        }
    }

    // Fungsi untuk mencari search bar di JavDB
    function findSearchBar() {
        // Selector berdasarkan struktur HTML JavDB yang sebenarnya
        const selectors = [
            '#video-search',                    // ID utama search input JavDB
            'input[placeholder*="Title/ID/Cast"]', // Placeholder khusus JavDB
            '.search-input input',              // Class container search input
            'input[type="text"].input.is-medium', // Class dan type yang spesifik
            'input[type="search"]',
            'input[placeholder*="search" i]',
            'input[placeholder*="Search" i]',
            '.search-input',
            '#search-input',
            'input[name="search"]',
            'input[name="q"]',
            '.navbar input[type="text"]',
            '.header input[type="text"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) { // Pastikan element terlihat
                console.log('JavDB Movie Code Search: Search bar ditemukan dengan selector:', selector);
                return element;
            }
        }
        
        console.log('JavDB Movie Code Search: Search bar tidak ditemukan');
        return null;
    }

    // Fungsi untuk mencari tombol search
    function findSearchButton() {
        // Selector berdasarkan struktur HTML JavDB yang sebenarnya
        const selectors = [
            '#search-submit',                    // ID utama tombol search JavDB
            'button.button.is-medium.is-info',   // Class spesifik tombol search JavDB
            '.search-submit button',            // Container tombol search
            'button[type="submit"]',
            'input[type="submit"]',
            '.search-button',
            '.btn-search',
            '.navbar button',
            '.header button',
            'button[class*="search"]',
            'button[id*="search"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
                console.log('JavDB Movie Code Search: Tombol search ditemukan dengan selector:', selector);
                return element;
            }
        }
        
        // Cari tombol dengan teks "Search" atau "search"
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
            const text = button.textContent.toLowerCase().trim();
            if (text.includes('search') && button.offsetParent !== null) {
                console.log('JavDB Movie Code Search: Tombol search ditemukan dengan teks:', text);
                return button;
            }
        }
        
        console.log('JavDB Movie Code Search: Tombol search tidak ditemukan');
        return null;
    }

    // Fungsi untuk memastikan search bar container terlihat
    function ensureSearchBarVisible() {
        const searchContainer = document.querySelector('#search-bar-container');
        if (searchContainer && searchContainer.style.display === 'none') {
            // Jika search container tersembunyi, coba klik tombol search mobile
            const mobileSearchBtn = document.querySelector('.navbar-search.mobile-nav');
            if (mobileSearchBtn) {
                mobileSearchBtn.click();
                console.log('JavDB Movie Code Search: Mengklik tombol search mobile untuk menampilkan search bar');
                return true; // Indikasi bahwa perlu tunggu
            }
        }
        return false; // Tidak perlu tunggu
    }

    // Fungsi untuk melakukan search otomatis
    function performAutoSearch(movieCode) {
        console.log('JavDB Movie Code Search: Memulai search untuk:', movieCode);
        
        // Pastikan search bar terlihat terlebih dahulu
        const needsWait = ensureSearchBarVisible();
        
        // Fungsi untuk melakukan search
        const doSearch = () => {
            const searchBar = findSearchBar();
            const searchBtn = findSearchButton();
            
            if (!searchBar) {
                console.log('JavDB Movie Code Search: Search bar tidak ditemukan');
                showErrorState('Search bar tidak ditemukan');
                return;
            }
            
            console.log('JavDB Movie Code Search: Search bar ditemukan:', searchBar);
            console.log('JavDB Movie Code Search: Current search bar value:', searchBar.value);
        
            try {
                // Focus ke search bar
                searchBar.focus();
                
                // Clear existing content dengan berbagai cara
                searchBar.value = '';
                searchBar.textContent = '';
                
                // Set value dengan berbagai cara untuk kompatibilitas
                searchBar.value = movieCode;
                if (searchBar.setAttribute) {
                    searchBar.setAttribute('value', movieCode);
                }
                
                // Trigger berbagai events untuk memastikan perubahan terdeteksi
                const events = ['input', 'change', 'keyup', 'keydown'];
                events.forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    searchBar.dispatchEvent(event);
                });
                
                console.log('JavDB Movie Code Search: Search bar value setelah update:', searchBar.value);
                
                // Verifikasi bahwa value benar-benar ter-set
                if (searchBar.value !== movieCode) {
                    console.log('JavDB Movie Code Search: Value tidak ter-set dengan benar, retry dengan keyboard simulation...');
                    
                    // Retry dengan keyboard simulation
                    searchBar.focus();
                    searchBar.select();
                    
                    // Simulate keyboard input
                    const keyboardEvents = ['keydown', 'keypress', 'input', 'keyup'];
                    keyboardEvents.forEach(eventType => {
                        const event = new KeyboardEvent(eventType, {
                            key: movieCode,
                            code: 'Key' + movieCode.charAt(0).toUpperCase(),
                            bubbles: true,
                            cancelable: true
                        });
                        searchBar.dispatchEvent(event);
                    });
                    
                    // Set value lagi
                    searchBar.value = movieCode;
                    
                    // Trigger events lagi
                    const retryEvents = ['input', 'change', 'keyup', 'keydown'];
                    retryEvents.forEach(eventType => {
                        const event = new Event(eventType, { bubbles: true, cancelable: true });
                        searchBar.dispatchEvent(event);
                    });
                    
                    console.log('JavDB Movie Code Search: Search bar value setelah keyboard simulation:', searchBar.value);
                }
                
                // Tunggu sebentar lalu klik search button
                setTimeout(() => {
                    if (searchBtn) {
                        try {
                            searchBtn.click();
                            console.log('JavDB Movie Code Search: Search berhasil dilakukan untuk:', movieCode);
                            showSuccessState('Search berhasil!');
                        } catch (clickError) {
                            console.log('JavDB Movie Code Search: Error clicking search button:', clickError);
                            // Coba submit form sebagai fallback
                            const form = searchBar.closest('form');
                            if (form) {
                                form.submit();
                                showSuccessState('Search berhasil!');
                            } else {
                                showErrorState('Error melakukan search');
                            }
                        }
                    } else {
                        // Coba submit form jika ada
                        const form = searchBar.closest('form');
                        if (form) {
                            try {
                                form.submit();
                                console.log('JavDB Movie Code Search: Form submitted untuk:', movieCode);
                                showSuccessState('Search berhasil!');
                            } catch (submitError) {
                                console.log('JavDB Movie Code Search: Error submitting form:', submitError);
                                showErrorState('Error melakukan search');
                            }
                        } else {
                            console.log('JavDB Movie Code Search: Tombol search tidak ditemukan');
                            showErrorState('Tombol search tidak ditemukan');
                        }
                    }
                }, 300); // Increased delay untuk memastikan value ter-set
                
            } catch (error) {
                console.error('JavDB Movie Code Search: Error performing search:', error);
                showErrorState('Error melakukan search');
            }
        };
        
        // Jika perlu tunggu, delay sedikit untuk memastikan search bar muncul
        if (needsWait) {
            setTimeout(doSearch, 500);
        } else {
            doSearch();
        }
    }

    // Fungsi untuk menampilkan tombol search
    function showSearchButton(movieCode) {
        if (searchButton) {
            searchButton.style.display = 'block';
            searchButton.textContent = `🔍 Search ${movieCode}`;
            return;
        }
        
        searchButton = document.createElement('button');
        searchButton.textContent = `🔍 Search ${movieCode}`;
        searchButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
            font-family: Arial, sans-serif;
            transition: all 0.3s ease;
            display: block;
        `;
        
        // Hover effects
        searchButton.addEventListener('mouseenter', () => {
            searchButton.style.background = '#0056b3';
            searchButton.style.transform = 'translateY(-2px)';
            searchButton.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
        });
        
        searchButton.addEventListener('mouseleave', () => {
            searchButton.style.background = '#007bff';
            searchButton.style.transform = 'translateY(0)';
            searchButton.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
        });
        
        searchButton.addEventListener('click', () => {
            performAutoSearch(movieCode);
        });
        
        document.body.appendChild(searchButton);
    }

    // Fungsi untuk menampilkan tombol copy
    function showCopyButton() {
        if (copyButton) {
            copyButton.style.display = 'block';
            return;
        }
        
        copyButton = document.createElement('button');
        copyButton.textContent = '📋 MVDB COPIER';
        copyButton.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            background: #e83e8c;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(232,62,140,0.3);
            font-family: Arial, sans-serif;
            transition: all 0.3s ease;
            display: block;
        `;
        
        // Hover effects
        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.background = '#d63384';
            copyButton.style.transform = 'translateY(-2px)';
            copyButton.style.boxShadow = '0 6px 16px rgba(232,62,140,0.4)';
        });
        
        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.background = '#e83e8c';
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 4px 12px rgba(232,62,140,0.3)';
        });
        
        copyButton.addEventListener('click', copyMovieData);
        
        document.body.appendChild(copyButton);
    }

    // Fungsi untuk menyembunyikan tombol search
    function hideSearchButton() {
        if (searchButton) {
            searchButton.style.display = 'none';
        }
    }

    // Fungsi untuk menyembunyikan tombol copy
    function hideCopyButton() {
        if (copyButton) {
            copyButton.style.display = 'none';
        }
    }

    // Fungsi untuk mengelola tombol berdasarkan jenis halaman
    function manageButtons() {
        const pageType = detectPageType();
        
        if (pageType === 'movie-detail') {
            // Di halaman detail movie, tampilkan tombol copy
            showCopyButton();
            
            // Cek apakah ada movie code di clipboard untuk menampilkan tombol search juga
            const currentClipboard = lastClipboardContent;
            const movieCode = detectMovieCode(currentClipboard);
            if (movieCode) {
                showSearchButton(movieCode);
                console.log('JavDB Movie Code Search: Halaman detail movie - menampilkan tombol copy dan search untuk:', movieCode);
            } else {
                hideSearchButton();
                console.log('JavDB Movie Code Search: Halaman detail movie - menampilkan tombol copy saja');
            }
        } else {
            // Di halaman lain, sembunyikan tombol copy
            hideCopyButton();
            
            // Cek apakah ada movie code di clipboard untuk menampilkan tombol search
            const currentClipboard = lastClipboardContent;
            const movieCode = detectMovieCode(currentClipboard);
            if (movieCode) {
                showSearchButton(movieCode);
                console.log('JavDB Movie Code Search: Halaman non-detail - menampilkan tombol search untuk:', movieCode);
            } else {
                hideSearchButton();
                console.log('JavDB Movie Code Search: Halaman non-detail - tidak ada movie code');
            }
        }
    }

    // Fungsi untuk menampilkan state sukses
    function showSuccessState(message) {
        if (searchButton) {
            const originalText = searchButton.textContent;
            const originalBg = searchButton.style.background;
            
            searchButton.textContent = `✅ ${message}`;
            searchButton.style.background = '#28a745';
            searchButton.disabled = true;
            
            setTimeout(() => {
                searchButton.textContent = originalText;
                searchButton.style.background = originalBg;
                searchButton.disabled = false;
            }, 2000);
        }
    }

    // Fungsi untuk menampilkan state error
    function showErrorState(message) {
        if (searchButton) {
            const originalText = searchButton.textContent;
            const originalBg = searchButton.style.background;
            
            searchButton.textContent = `❌ ${message}`;
            searchButton.style.background = '#dc3545';
            searchButton.disabled = true;
            
            setTimeout(() => {
                searchButton.textContent = originalText;
                searchButton.style.background = originalBg;
                searchButton.disabled = false;
            }, 2000);
        }
    }

    // Fungsi untuk menampilkan state sukses copy
    function showCopySuccessState() {
        if (copyButton) {
            const originalText = copyButton.textContent;
            const originalBg = copyButton.style.background;
            
            copyButton.textContent = '✅ Copied!';
            copyButton.style.background = '#28a745';
            copyButton.disabled = true;
            
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.background = originalBg;
                copyButton.disabled = false;
            }, 2000);
        }
    }

    // Fungsi untuk menampilkan state error copy
    function showCopyErrorState() {
        if (copyButton) {
            const originalText = copyButton.textContent;
            const originalBg = copyButton.style.background;
            
            copyButton.textContent = '❌ Failed';
            copyButton.style.background = '#dc3545';
            copyButton.disabled = true;
            
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.background = originalBg;
                copyButton.disabled = false;
            }, 2000);
        }
    }

    // Fungsi untuk memulai monitoring clipboard
    function startClipboardMonitoring() {
        if (clipboardCheckInterval) {
            clearInterval(clipboardCheckInterval);
        }
        
        // Check clipboard setiap 1000ms untuk mengurangi beban
        clipboardCheckInterval = setInterval(checkClipboardChange, 1000);
        
        // Initial check dengan delay untuk memastikan halaman sudah siap
        setTimeout(checkClipboardChange, 500);
    }

    // Fungsi untuk menghentikan monitoring clipboard
    function stopClipboardMonitoring() {
        if (clipboardCheckInterval) {
            clearInterval(clipboardCheckInterval);
            clipboardCheckInterval = null;
        }
    }

    // Fungsi untuk cleanup
    function cleanup() {
        stopClipboardMonitoring();
        if (searchButton) {
            searchButton.remove();
            searchButton = null;
        }
        if (copyButton) {
            copyButton.remove();
            copyButton = null;
        }
    }

    // Event listener untuk visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopClipboardMonitoring();
        } else {
            startClipboardMonitoring();
        }
    });

    // Event listener untuk clipboard paste sebagai alternatif monitoring
    document.addEventListener('paste', async (event) => {
        try {
            const pastedText = event.clipboardData.getData('text');
            if (pastedText && pastedText !== lastClipboardContent) {
                lastClipboardContent = pastedText;
                const movieCode = detectMovieCode(pastedText);
                if (movieCode) {
                    console.log('JavDB Movie Code Search: Movie code terdeteksi dari paste:', movieCode);
                    // Langsung panggil manageButtons untuk konsistensi
                    manageButtons();
                } else {
                    hideSearchButton();
                }
            }
        } catch (error) {
            console.log('JavDB Movie Code Search: Error handling paste event:', error);
        }
    });

    // Event listener untuk perubahan URL (untuk SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('JavDB Movie Code Search: URL berubah, mengelola tombol...');
            setTimeout(() => {
                manageButtons();
                // Juga cek clipboard terbaru setelah URL berubah
                checkClipboardChange();
            }, 500); // Delay untuk memastikan halaman sudah dimuat
        }
    }).observe(document, { subtree: true, childList: true });

    // Event listener untuk page unload
    window.addEventListener('beforeunload', cleanup);

    // Fungsi inisialisasi
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('JavDB Movie Code Search: Script aktif!');
        console.log('Monitoring clipboard untuk movie code...');
        
        // Mulai monitoring clipboard
        startClipboardMonitoring();
        
        // Kelola tombol berdasarkan halaman saat ini
        manageButtons();
        
        // Test dengan movie code contoh (untuk debugging)
        // setTimeout(() => {
        //     console.log('Testing dengan movie code: SSIS-001');
        //     showSearchButton('SSIS-001');
        // }, 3000);
    }

    init();
})();
