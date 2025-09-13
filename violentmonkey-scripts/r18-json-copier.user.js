// ==UserScript==
// @name         R18.dev JSON Data Copier
// @namespace    http://violentmonkey.com/
// @version      1.0
// @description  Script untuk mendeteksi dan copy JSON data dari r18.dev untuk MVDB parser
// @author       MVDB Team
// @match        https://r18.dev/*
// @grant        GM_setClipboard
// @grant        GM_getClipboard
// @run-at       document-end
// @compatible   Violentmonkey
// ==/UserScript==

/*
FITUR:
- Deteksi halaman detail movie di r18.dev
- Otomatis navigate ke URL JSON (misalnya: /detail/-/combined=snis00217/json)
- Ekstrak JSON data dari halaman JSON
- Otomatis copy JSON data ke clipboard
- Otomatis kembali ke halaman sebelumnya setelah copy
- Format JSON yang kompatibel dengan MVDB parser
- Error handling yang robust
- Visual feedback untuk user

ALUR KERJA:
1. Script mendeteksi halaman detail movie di r18.dev
2. Ketika user klik tombol "Copy JSON Data":
   - Navigate ke URL JSON (misalnya: https://r18.dev/videos/vod/movies/detail/-/combined=snis00217/json)
3. Ketika script load di halaman JSON:
   - Otomatis deteksi bahwa kita di halaman JSON
   - Tunggu halaman JSON load (2 detik)
   - Ekstrak JSON data dari halaman
   - Copy JSON data ke clipboard
   - Otomatis kembali ke halaman sebelumnya
4. User paste data ke MVDB parser

PERBAIKAN:
- Script sekarang otomatis melanjutkan proses ketika navigate ke halaman JSON
- Visual feedback menunjukkan status proses (Processing → Extracting → Copying → Going back)
- Tidak perlu klik tombol lagi di halaman JSON

CONTOH URL:
- Detail: https://r18.dev/videos/vod/movies/detail/-/combined=snis00217
- JSON: https://r18.dev/videos/vod/movies/detail/-/combined=snis00217/json
*/

(function() {
    'use strict';

    let copyButton = null;
    let isProcessing = false;

    // Fungsi untuk membuat tombol copy
    function createCopyButton() {
        if (copyButton) return;

        copyButton = document.createElement('button');
        copyButton.innerHTML = '📋 Copy JSON Data';
        copyButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Hover effects
        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.transform = 'translateY(-2px)';
            copyButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        });

        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });

        copyButton.addEventListener('click', handleCopyJsonData);
        document.body.appendChild(copyButton);

        console.log('R18 JSON Copier: Tombol copy berhasil dibuat');
    }

    // Fungsi untuk menghapus tombol copy
    function removeCopyButton() {
        if (copyButton) {
            copyButton.remove();
            copyButton = null;
            console.log('R18 JSON Copier: Tombol copy dihapus');
        }
    }

    // Fungsi untuk mendapatkan URL JSON dari halaman saat ini
    function getJsonUrl() {
        const currentUrl = window.location.href;
        
        // Jika sudah di halaman JSON, return URL saat ini
        if (currentUrl.includes('/json')) {
            return currentUrl;
        }
        
        // Konstruksi URL JSON dari URL saat ini
        // Pattern: https://r18.dev/videos/vod/movies/detail/-/combined=snis00217
        // Menjadi: https://r18.dev/videos/vod/movies/detail/-/combined=snis00217/json
        
        // Cek apakah URL sudah memiliki pattern yang benar
        if (currentUrl.includes('/videos/vod/movies/detail/')) {
            const jsonUrl = currentUrl + '/json';
            console.log('R18 JSON Copier: Konstruksi URL JSON:', jsonUrl);
            return jsonUrl;
        }
        
        // Fallback: coba berbagai kemungkinan pattern
        const possiblePatterns = [
            currentUrl + '/json',
            currentUrl.replace(/\/$/, '') + '/json',
            currentUrl + '.json',
            currentUrl.replace(/\/$/, '') + '.json'
        ];
        
        for (const pattern of possiblePatterns) {
            if (pattern.includes('r18.dev') && pattern.includes('json')) {
                console.log('R18 JSON Copier: Fallback URL JSON:', pattern);
                return pattern;
            }
        }
        
        return null;
    }

    // Fungsi untuk mengekstrak JSON data dari halaman
    function extractJsonData() {
        console.log('R18 JSON Copier: Mulai ekstrak JSON data...');
        
        // 1. Coba ekstrak dari body text (untuk halaman JSON yang menampilkan raw JSON)
        const bodyText = document.body.textContent || document.body.innerText;
        if (bodyText && bodyText.trim().startsWith('{')) {
            try {
                // Coba parse seluruh body text sebagai JSON
                const jsonData = JSON.parse(bodyText.trim());
                if (jsonData && (jsonData.dvd_id || jsonData.id || jsonData.title)) {
                    console.log('R18 JSON Copier: JSON data ditemukan di body text');
                    return JSON.stringify(jsonData, null, 2);
                }
            } catch (e) {
                console.log('R18 JSON Copier: Body text bukan JSON valid:', e);
            }
        }

        // 2. Cari pre tag yang berisi JSON (format umum untuk raw JSON)
        const preTags = document.querySelectorAll('pre');
        for (const pre of preTags) {
            const content = pre.textContent || pre.innerText;
            if (content && content.trim().startsWith('{')) {
                try {
                    const jsonData = JSON.parse(content.trim());
                    if (jsonData && (jsonData.dvd_id || jsonData.id || jsonData.title)) {
                        console.log('R18 JSON Copier: JSON data ditemukan di pre tag');
                        return JSON.stringify(jsonData, null, 2);
                    }
                } catch (e) {
                    console.log('R18 JSON Copier: Gagal parse JSON dari pre tag:', e);
                }
            }
        }

        // 3. Cari script tag yang berisi JSON data
        const scriptTags = document.querySelectorAll('script');
        for (const script of scriptTags) {
            const content = script.textContent || script.innerHTML;
            if (content.includes('"dvd_id"') || content.includes('"id"') || content.includes('"title"')) {
                try {
                    // Coba ekstrak JSON dari script content
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const jsonData = JSON.parse(jsonMatch[0]);
                        if (jsonData && (jsonData.dvd_id || jsonData.id || jsonData.title)) {
                            console.log('R18 JSON Copier: JSON data ditemukan di script tag');
                            return JSON.stringify(jsonData, null, 2);
                        }
                    }
                } catch (e) {
                    console.log('R18 JSON Copier: Gagal parse JSON dari script tag:', e);
                }
            }
        }

        // 4. Cari data attributes
        const elementsWithData = document.querySelectorAll('[data-movie], [data-film], [data-content]');
        for (const element of elementsWithData) {
            const dataValue = element.getAttribute('data-movie') || 
                            element.getAttribute('data-film') || 
                            element.getAttribute('data-content');
            if (dataValue) {
                try {
                    const jsonData = JSON.parse(dataValue);
                    if (jsonData && (jsonData.dvd_id || jsonData.id || jsonData.title)) {
                        console.log('R18 JSON Copier: JSON data ditemukan di data attribute');
                        return JSON.stringify(jsonData, null, 2);
                    }
                } catch (e) {
                    console.log('R18 JSON Copier: Gagal parse JSON dari data attribute:', e);
                }
            }
        }

        // 5. Cari di window object
        if (window.movieData || window.filmData || window.contentData) {
            const data = window.movieData || window.filmData || window.contentData;
            if (data && (data.dvd_id || data.id || data.title)) {
                console.log('R18 JSON Copier: JSON data ditemukan di window object');
                return JSON.stringify(data, null, 2);
            }
        }

        // 6. Debug: Log informasi halaman untuk troubleshooting
        console.log('R18 JSON Copier: Debug info:');
        console.log('- URL:', window.location.href);
        console.log('- Body text length:', bodyText ? bodyText.length : 0);
        console.log('- Pre tags count:', preTags.length);
        console.log('- Script tags count:', scriptTags.length);
        console.log('- Body text preview:', bodyText ? bodyText.substring(0, 200) : 'No body text');

        return null;
    }

    // Fungsi untuk fetch JSON data dari URL
    async function fetchJsonData(url) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.dvd_id && data.title_ja) {
                    console.log('R18 JSON Copier: JSON data berhasil di-fetch dari URL');
                    return JSON.stringify(data, null, 2);
                }
            }
        } catch (error) {
            console.log('R18 JSON Copier: Gagal fetch JSON dari URL:', error);
        }
        return null;
    }

    // Fungsi utama untuk copy JSON data
    async function handleCopyJsonData() {
        if (isProcessing) return;
        
        isProcessing = true;
        copyButton.innerHTML = '⏳ Processing...';
        copyButton.style.opacity = '0.7';
        copyButton.style.cursor = 'not-allowed';

        try {
            // 1. Cek apakah kita sudah di halaman JSON
            if (window.location.href.includes('/json')) {
                console.log('R18 JSON Copier: Sudah di halaman JSON, ekstrak data');
                copyButton.innerHTML = '⏳ Extracting JSON...';
                
                // Tunggu sebentar untuk memastikan halaman sudah load
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Ekstrak JSON data dari halaman saat ini
                const jsonData = extractJsonData();
                
                if (jsonData) {
                    // Copy ke clipboard
                    await GM_setClipboard(jsonData);
                    
                    // Update button untuk menunjukkan success
                    copyButton.innerHTML = '✅ Copied!';
                    copyButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    
                    // Tunggu sebentar lalu back ke halaman sebelumnya
                    setTimeout(() => {
                        window.history.back();
                    }, 1500);
                    
                    console.log('R18 JSON Copier: JSON data berhasil di-copy dan akan kembali ke halaman sebelumnya');
                } else {
                    throw new Error('Tidak bisa mengekstrak JSON data dari halaman');
                }
            } else {
                // 2. Jika belum di halaman JSON, navigate ke URL JSON
                const jsonUrl = getJsonUrl();
                
                if (jsonUrl) {
                    console.log('R18 JSON Copier: Navigate ke URL JSON:', jsonUrl);
                    copyButton.innerHTML = '⏳ Navigating to JSON...';
                    
                    // Navigate ke URL JSON
                    window.location.href = jsonUrl;
                } else {
                    // 3. Jika tidak ada URL JSON, coba ekstrak dari halaman saat ini
                    console.log('R18 JSON Copier: Tidak ada URL JSON, coba ekstrak dari halaman saat ini');
                    copyButton.innerHTML = '⏳ Extracting JSON...';
                    
                    const jsonData = extractJsonData();
                    
                    if (jsonData) {
                        // Copy ke clipboard
                        await GM_setClipboard(jsonData);
                        
                        // Update button untuk menunjukkan success
                        copyButton.innerHTML = '✅ Copied!';
                        copyButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                        
                        console.log('R18 JSON Copier: JSON data berhasil di-copy dari halaman saat ini');
                    } else {
                        throw new Error('Tidak ada JSON data yang ditemukan');
                    }
                }
            }
            
            // Reset button setelah 2 detik (kecuali jika akan navigate)
            if (!window.location.href.includes('/json')) {
                setTimeout(() => {
                    copyButton.innerHTML = '📋 Copy JSON Data';
                    copyButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    copyButton.style.opacity = '1';
                    copyButton.style.cursor = 'pointer';
                    isProcessing = false;
                }, 2000);
            }
            
        } catch (error) {
            console.error('R18 JSON Copier: Error saat copy JSON data:', error);
            
            // Update button untuk menunjukkan error
            copyButton.innerHTML = '❌ Error';
            copyButton.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
            
            // Reset button setelah 2 detik
            setTimeout(() => {
                copyButton.innerHTML = '📋 Copy JSON Data';
                copyButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                copyButton.style.opacity = '1';
                copyButton.style.cursor = 'pointer';
                isProcessing = false;
            }, 2000);
        }
    }

    // Fungsi untuk memeriksa apakah halaman sudah siap
    function checkPageReady() {
        // Tunggu hingga DOM siap
        if (document.readyState === 'loading') {
            return false;
        }

        // Cek apakah ada elemen yang menunjukkan ini adalah halaman detail movie
        const indicators = [
            'h1', 'h2', '.title', '.movie-title', '.film-title',
            '.content-title', '[data-title]', '.page-title'
        ];

        for (const selector of indicators) {
            if (document.querySelector(selector)) {
                return true;
            }
        }

        return false;
    }

    // Fungsi untuk mengelola tombol berdasarkan kondisi halaman
    function manageButton() {
        if (checkPageReady()) {
            // Cek apakah kita di halaman JSON atau halaman detail movie
            const isJsonPage = window.location.href.includes('/json');
            const isDetailPage = window.location.href.includes('/videos/vod/movies/detail/');
            const hasTitle = document.querySelector('h1, h2, .title');
            
            if (isJsonPage || isDetailPage || hasTitle) {
                createCopyButton();
                
                // Update button text berdasarkan jenis halaman
                if (copyButton) {
                    if (isJsonPage) {
                        copyButton.innerHTML = '📋 Copy JSON Data';
                        copyButton.title = 'Klik untuk copy JSON data dan kembali ke halaman sebelumnya';
                    } else {
                        copyButton.innerHTML = '📋 Copy JSON Data';
                        copyButton.title = 'Klik untuk navigate ke halaman JSON dan copy data';
                    }
                }
            } else {
                removeCopyButton();
            }
        } else {
            removeCopyButton();
        }
    }

    // Observer untuk perubahan DOM
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        let jsonDataAppeared = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldCheck = true;
                
                // Cek apakah ada JSON data yang muncul setelah download
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent.trim();
                        if (text.startsWith('{') && text.includes('"dvd_id"')) {
                            jsonDataAppeared = true;
                            console.log('R18 JSON Copier: JSON data terdeteksi muncul di DOM');
                            break;
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = node.textContent || '';
                        if (text.includes('"dvd_id"') && text.includes('"title_ja"')) {
                            jsonDataAppeared = true;
                            console.log('R18 JSON Copier: JSON data terdeteksi muncul di DOM');
                            break;
                        }
                    }
                }
            }
        });

        if (shouldCheck) {
            setTimeout(manageButton, 500); // Delay untuk memastikan DOM sudah stabil
        }
        
        if (jsonDataAppeared && copyButton) {
            // Update button untuk menunjukkan bahwa JSON data sudah tersedia
            copyButton.innerHTML = '📋 Copy JSON Data';
            copyButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            copyButton.title = 'JSON data tersedia! Klik untuk copy.';
        }
    });

    // Fungsi inisialisasi
    function init() {
        console.log('R18 JSON Copier: Script aktif!');
        
        // Mulai observer
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Cek kondisi awal
        setTimeout(manageButton, 1000);
        
        // Jika kita di halaman JSON, langsung proses copy dan back
        if (window.location.href.includes('/json')) {
            console.log('R18 JSON Copier: Deteksi halaman JSON, mulai proses copy dan back');
            
            // Buat tombol untuk menunjukkan proses sedang berjalan
            const statusButton = document.createElement('div');
            statusButton.innerHTML = '⏳ Processing JSON...';
            statusButton.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(statusButton);
            
            setTimeout(async () => {
                try {
                    // Update status
                    statusButton.innerHTML = '⏳ Extracting JSON...';
                    
                    // Tunggu sebentar untuk memastikan halaman sudah load
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Ekstrak JSON data
                    let jsonData = extractJsonData();
                    
                    // Jika gagal ekstrak dari DOM, coba fetch dari URL saat ini
                    if (!jsonData) {
                        console.log('R18 JSON Copier: Gagal ekstrak dari DOM, coba fetch dari URL');
                        statusButton.innerHTML = '⏳ Fetching JSON from URL...';
                        jsonData = await fetchJsonData(window.location.href);
                    }
                    
                    if (jsonData) {
                        // Update status
                        statusButton.innerHTML = '⏳ Copying to clipboard...';
                        
                        // Copy ke clipboard
                        await GM_setClipboard(jsonData);
                        
                        // Update status
                        statusButton.innerHTML = '✅ Copied! Going back...';
                        statusButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                        
                        console.log('R18 JSON Copier: JSON data berhasil di-copy, kembali ke halaman sebelumnya');
                        
                        // Tunggu sebentar lalu kembali ke halaman sebelumnya
                        setTimeout(() => {
                            window.history.back();
                        }, 1000);
                    } else {
                        statusButton.innerHTML = '❌ Failed to extract JSON';
                        statusButton.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                        console.log('R18 JSON Copier: Gagal mengekstrak JSON data dari semua metode');
                    }
                } catch (error) {
                    statusButton.innerHTML = '❌ Error occurred';
                    statusButton.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                    console.error('R18 JSON Copier: Error saat proses copy dan back:', error);
                }
            }, 1000);
        }
    }

    // Mulai script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup saat halaman di-unload
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
        removeCopyButton();
    });

})();
