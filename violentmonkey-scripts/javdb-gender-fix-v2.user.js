// ==UserScript==
// @name         JavDB Gender Fix V2 - Deteksi Gender yang Benar
// @namespace    http://violentmonkey.com/
// @version      2.0
// @description  Script khusus untuk mendeteksi gender aktor/aktris yang benar dari javdb.com - berdasarkan struktur HTML yang benar
// @author       MVDB Team
// @match        https://javdb.com/v/*
// @grant        GM_setClipboard
// @run-at       document-end
// @compatible   Violentmonkey
// ==/UserScript==

(function() {
    'use strict';

    // Fungsi ekstraksi data dengan deteksi gender yang benar
    function extractSimpleData() {
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
                            // Ekstrak aktor dengan deteksi gender yang benar
                            data.actors = extractActorsWithGender(value);
                            break;
                    }
                }
            }
        });

        return data;
    }

    // Fungsi khusus untuk mengekstrak aktor dengan gender yang benar berdasarkan struktur HTML
    function extractActorsWithGender(valueElement) {
        const actors = [];
        
        // Ambil semua link aktor
        const actorLinks = valueElement.querySelectorAll('a');
        
        actorLinks.forEach(link => {
            const actorName = link.textContent.trim();
            let genderSymbol = '';
            
            // Cari simbol gender di sibling element yang mengikuti link
            // Struktur: <a>Nama</a><strong class="symbol female/male">♀/♂</strong>
            let nextSibling = link.nextSibling;
            
            while (nextSibling) {
                if (nextSibling.nodeType === Node.ELEMENT_NODE) {
                    // Cek apakah ini adalah elemen strong dengan class symbol
                    if (nextSibling.tagName === 'STRONG' && nextSibling.classList.contains('symbol')) {
                        if (nextSibling.classList.contains('female')) {
                            genderSymbol = '♀';
                        } else if (nextSibling.classList.contains('male')) {
                            genderSymbol = '♂';
                        }
                        break;
                    }
                }
                nextSibling = nextSibling.nextSibling;
            }
            
            // Debug info
            console.log(`Actor: ${actorName}, Gender: ${genderSymbol}`);
            
            actors.push(`${actorName}${genderSymbol}`);
        });
        
        return actors;
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
        
        // Format Actor(s) dengan gender yang benar
        if (data.actors && data.actors.length > 0) {
            lines.push(`Actor(s): ${data.actors.join(' ')}`);
        }
        
        // Tags diabaikan oleh parser, tapi tetap ditambahkan untuk referensi
        if (data.tags && data.tags.length > 0) {
            lines.push(`Tags: ${data.tags.join(', ')}`);
        }

        return lines.join('\n');
    }

    // Copy ke clipboard - kompatibel dengan Violentmonkey
    function copyData() {
        const data = extractSimpleData();
        const formatted = formatForParser(data);
        
        // Debug info
        console.log('Extracted data:', data);
        console.log('Formatted output:', formatted);
        console.log('Actors with gender:', data.actors);
        
        try {
            // Coba GM_setClipboard dulu (Violentmonkey)
            if (typeof GM_setClipboard !== 'undefined') {
                GM_setClipboard(formatted);
                showSuccessState();
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
                    showSuccessState();
                } else {
                    showErrorState();
                    console.log('Data untuk copy manual:', formatted);
                }
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            showErrorState();
            console.log('Data untuk copy manual:', formatted);
        }
    }

    // Fungsi untuk menampilkan state sukses
    function showSuccessState() {
        const button = document.querySelector('[data-javdb-extractor="true"]');
        if (button) {
            const originalText = button.textContent;
            const originalBg = button.style.background;
            
            button.textContent = '✅ Copied!';
            button.style.background = '#28a745';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = originalBg;
                button.disabled = false;
            }, 2000);
        }
    }

    // Fungsi untuk menampilkan state error
    function showErrorState() {
        const button = document.querySelector('[data-javdb-extractor="true"]');
        if (button) {
            const originalText = button.textContent;
            const originalBg = button.style.background;
            
            button.textContent = '❌ Failed';
            button.style.background = '#dc3545';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = originalBg;
                button.disabled = false;
            }, 2000);
        }
    }

    // Buat tombol sederhana
    function createSimpleButton() {
        const button = document.createElement('button');
        button.textContent = '🔧 MVDB COPIER';
        button.setAttribute('data-javdb-extractor', 'true');
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #e83e8c;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
            transition: all 0.3s ease;
        `;

        button.addEventListener('click', copyData);
        return button;
    }

    // Tunggu halaman dimuat dan tambahkan tombol
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Pastikan di halaman detail film
        if (!window.location.pathname.match(/^\/v\/[A-Za-z0-9]+$/)) {
            console.log('JavDB Gender Fix V2: Bukan halaman detail film');
            return;
        }

        // Tunggu sedikit untuk memastikan elemen sudah dimuat
        setTimeout(() => {
            const button = createSimpleButton();
            document.body.appendChild(button);
            
            // Debug info
            console.log('JavDB Gender Fix V2: Script aktif!');
            console.log('Elements found:', {
                panelBlocks: document.querySelectorAll('.panel-block').length,
                title: document.querySelector('.current-title'),
                moviePanel: document.querySelector('.movie-panel-info')
            });
            
            // Test gender detection
            const actorBlock = document.querySelector('.panel-block:has(strong:contains("Actor"))');
            if (actorBlock) {
                const valueElement = actorBlock.querySelector('.value');
                if (valueElement) {
                    console.log('Actor block HTML:', valueElement.innerHTML);
                    const actorLinks = valueElement.querySelectorAll('a');
                    actorLinks.forEach((link, index) => {
                        const nextSibling = link.nextSibling;
                        console.log(`Actor ${index + 1}:`, {
                            name: link.textContent.trim(),
                            nextSibling: nextSibling ? nextSibling.outerHTML : 'none',
                            hasSymbol: nextSibling && nextSibling.classList && nextSibling.classList.contains('symbol')
                        });
                    });
                }
            }
        }, 1000);
    }

    init();
})();
