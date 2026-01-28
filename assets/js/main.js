// main.js - VERSI YANG SUDAH DIPERBAIKI
document.addEventListener('DOMContentLoaded', async () => {
    
    // Inisialisasi Library Icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Variabel Global
    let allResults = []; 
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    let currentLimit = isIndexPage ? 4 : (typeof TravelStore !== 'undefined' ? TravelStore.getDisplayLimit() : 12);

    // Referensi Elemen
    const grid = document.getElementById('results-grid');
    const orb = document.querySelector('.floating-orb');
    
    // ============================================================
    // 1. LOGIKA RENDER GRID (Engine Utama)
    // ============================================================
    const renderGrid = () => {
        if (!grid) return;

        console.log(`🎮 MAIN: Rendering ${currentLimit} items...`);

        // Potong data sesuai limit
        const visibleItems = allResults.slice(0, currentLimit);
        
        // Generate HTML Kartu
        const html = visibleItems.map((dest, index) => { 
            const sourceParam = isIndexPage ? 'index' : 'daftar';
            
            return `
                <a href="detail.html?id=${dest.id}&from=${sourceParam}" class="luxury-card fade-in" style="animation-delay: ${index * 0.05}s">
                    <div class="card-image-wrap">
                        <div class="match-badge">${dest.matchScore}% Match</div>
                        <img src="${dest.image}" alt="${dest.nama}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <div class="card-meta">
                            <i data-lucide="map-pin"></i> ${dest.lokasi}
                        </div>
                        <h3>${dest.nama}</h3>
                        <div class="card-footer">
                            <span class="tag">${dest.kategori[0] || 'Wisata'}</span>
                            <span class="price">Rp ${dest.harga.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        grid.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Update UI Tombol Load More
        updateLoadMoreUI(visibleItems.length, allResults.length);
    };

    const updateLoadMoreUI = (shown, total) => {
        const oldBtn = document.getElementById('btn-load-more-container');
        if (oldBtn) oldBtn.remove();

        let uiHTML = '';
        if (shown < total) {
            uiHTML = isIndexPage ? ' ' :  `
                <div class="load-more-container" id="btn-load-more-container">
                    <button class="btn-explore-deeper" id="btn-manual-load">
                        Explore Deeper (${total - shown} more) <i data-lucide="arrow-down"></i>
                    </button>
                </div>
            `;
        } else {
            uiHTML = `
                <div class="end-mark" id="btn-load-more-container">
                    <i data-lucide="check-circle" style="color:var(--primary)"></i>
                    <p>All Collections Revealed</p>
                </div>
            `;
        }

        grid.insertAdjacentHTML('afterend', uiHTML);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const manualBtn = document.getElementById('btn-manual-load');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                currentLimit += 12; 
                TravelStore.saveDisplayLimit(currentLimit); 
                renderGrid(); 
                if(window.updateOrbMenuState) window.updateOrbMenuState();
            });
        }
    };

    // ============================================================
    // 2. LOGIKA ORB HUB (The Controller)
    // ============================================================
    if (orb) {
        // Inject Menu HTML
        const menuHTML = `
            <div class="orb-menu" id="orb-menu">
                <div class="menu-header">AI CONTROL HUB</div>
                <button class="menu-item" data-limit="12">View 12 Items</button>
                <button class="menu-item" data-limit="24">View 24 Items</button>
                <button class="menu-item" data-limit="410">View All Collection</button>
                <div style="height:1px; background:rgba(255,255,255,0.1); margin:10px 0;"></div>
                <button class="menu-item primary" onclick="window.location.href='preferences.html'">
                    <i data-lucide="refresh-cw" style="width:14px; display:inline;"></i> Referensi Wisata
                </button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        const menu = document.getElementById('orb-menu');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Helper: Highlight tombol aktif
        window.updateOrbMenuState = () => {
            document.querySelectorAll('.menu-item[data-limit]').forEach(btn => {
                const limitBtn = parseInt(btn.dataset.limit);
                if (limitBtn === currentLimit || (limitBtn === 410 && currentLimit >= allResults.length)) {
                    btn.classList.add('primary');
                    btn.style.border = "1px solid var(--primary)";
                } else {
                    btn.classList.remove('primary');
                    btn.style.border = "none";
                }
            });
        };

        orb.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
            orb.classList.toggle('active');
            updateOrbMenuState();
        });

        document.querySelectorAll('.menu-item[data-limit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const newLimit = parseInt(btn.dataset.limit);
                currentLimit = newLimit;
                TravelStore.saveDisplayLimit(newLimit);
                renderGrid();
                menu.classList.remove('active');
                orb.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !orb.contains(e.target)) {
                menu.classList.remove('active');
                orb.classList.remove('active');
            }
        });
    }

    // ============================================================
    // 3. HALAMAN DAFTAR (Data Fetching)
    // ============================================================
    if (grid) {
        try {
            allResults = await TravelEngine.processRecommendations();
            const countLabel = document.getElementById('total-match');
            if (countLabel) countLabel.innerText = allResults.length;

            if (allResults.length > 0) {
                renderGrid();
            } else {
                const dna = TravelStore.getUserDNA();
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                        <h2 style="color: var(--primary); font-family: 'Cinzel', serif;">NO MATCH FOUND</h2>
                        <p style="color: #888; margin-top:1rem;">
                            Kriteria Anda terlalu ketat (Range: ${dna.match}%).<br>
                            Coba turunkan range di halaman referensi wisata.
                        </p>
                        <button onclick="window.location.href='preferences.html'" class="btn-explore-deeper" style="margin: 2rem auto;">
                            Referensi Wisata
                        </button>
                    </div>
                `;
            }
        } catch (err) {
            console.error("🎮 MAIN ERROR:", err);
            grid.innerHTML = `<div style="color:red; text-align:center;">ERROR: ${err.message}</div>`;
        }
    }

    // ============================================================
    // 4. HALAMAN DETAIL (Logic Standar)
    // ============================================================
    const detailTitle = document.getElementById('dest-title');
    if (detailTitle) {
        const id = new URLSearchParams(window.location.search).get('id');
        const dest = await TravelStore.getDestinationById(id);
        
        if (dest) {
            // Render Basic Info
            document.getElementById('dest-image').src = dest.image;
            document.getElementById('dest-title').innerText = dest.nama;
            document.getElementById('dest-location').innerText = dest.lokasi;
            document.getElementById('dest-description').innerText = dest.deskripsi;
            document.getElementById('dest-price').innerText = `Rp ${dest.harga.toLocaleString('id-ID')}`;
            
            // Hitung Score untuk Halaman Detail
            const dna = TravelStore.getUserDNA();
            const score = TravelEngine.calculateScore(dest, dna);
            document.getElementById('dest-match').innerText = score;
            const circle = document.getElementById('score-circle');
            if(circle) circle.setAttribute('stroke-dasharray', `${score}, 100`);

            // Render Tags Activities
            const activityContainer = document.getElementById('dest-activities');
            if(activityContainer) {
                // Tampilkan Aktivitas sebagai Tag
                activityContainer.innerHTML = dest.aktivitas.map(k => 
                    `<span class="tag">${k}</span>`
                ).join(' ');
            }
            
            // Render Kategori di Header
            const catContainer = document.getElementById('dest-categories');
            if(catContainer) {
                catContainer.innerHTML = dest.kategori.map(k => 
                    `<span class="tag">${k}</span>`
                ).join(' ');
            }

            // ============================================================
            // 5. FITUR MAP INTELLIGENCE (FIXED & ROBUST)
            // ============================================================
            const mapFrame = document.getElementById('gmap-canvas');
            const mapBtn = document.getElementById('btn-open-maps');
            const addressText = document.getElementById('dest-address-text');

            if (mapFrame) {
                // Encode agar spasi dan karakter khusus aman di URL
                const searchQuery = encodeURIComponent(`${dest.nama} ${dest.lokasi}`);
                
                // Gunakan Google Maps Embed Standard URL (Lebih Stabil)
                // q=Query, z=Zoom(13), output=embed
                const mapUrl = `https://maps.google.com/maps?q=${searchQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
                
                mapFrame.src = mapUrl;
                
                // Set Tombol Buka Map Asli
                if(mapBtn) {
                    mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
                }
                
                if(addressText) {
                    addressText.innerText = dest.lokasi;
                }
            }

            // ============================================================
            // 6. RENDER SIMILAR DESTINATIONS (Fix Logic)
            // ============================================================
            // Ambil data similar
            const similar = await TravelEngine.getSimilarDestinations(id);
            const simGrid = document.getElementById('similar-grid');
            
            if(simGrid) {
                if (similar.length > 0) {
                    simGrid.innerHTML = similar.map(s => `
                        <a href="detail.html?id=${s.id}" class="similar-item" style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem; text-decoration:none; color:#000;">
                            <img src="${s.image}" style="width:60px; height:60px; border-radius:10px; object-fit:cover;">
                            <div>
                                <div style="font-weight:bold; font-size:0.9rem; line-height:1.2;">${s.nama}</div>
                                <div style="font-size:0.7rem; color:#888;">${s.lokasi}</div>
                            </div>
                        </a>
                    `).join('');
                } else {
                    simGrid.innerHTML = `<p style="color:#666; font-size:0.8rem; font-style:italic;">Tidak ada destinasi serupa yang ditemukan.</p>`;
                }
            }
        }
    }
    
    const analyzeBtn = document.querySelector('.btn-analyze');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const region = document.getElementById('filter-region').value;
            const vibe = document.getElementById('filter-vibe').value;
            const minScore = parseInt(document.querySelector('.range-input').value);

            // Update DNA sementara untuk pencarian ini
            const currentDNA = TravelStore.getUserDNA();
            currentDNA.vibe = vibe;
            currentDNA.match = minScore;
            TravelStore.saveUserDNA(currentDNA);

            // Proses ulang data
            let results = await TravelEngine.processRecommendations();

            // Filter tambahan berdasarkan Region (jika bukan 'all')
            if (region !== 'all') {
                results = results.filter(dest => 
                    dest.lokasi.toLowerCase().includes(region.toLowerCase())
                );
            }

            // Tampilkan hasil
            allResults = results;
            renderGrid();
            
            // Scroll otomatis ke hasil
            document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// ============================================================
// LOGIKA PREFERENSI (Diluar DOMContentLoaded utama)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Update angka slider match range
    const rangeInput = document.getElementById('match-range');
    if (rangeInput) {
        rangeInput.oninput = function() { 
            document.getElementById('match-val').innerText = this.value; 
        };
    }

    // 2. Logika Submit (Gunakan ID 'prefForm' yang sesuai dengan HTML)
    const form = document.getElementById('prefForm');
    const submitBtn = document.getElementById('submit-btn');

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            const formData = new FormData(form);
            
            // Ambil data dari form
            const userChoice = {
                vibe: formData.get('vibe'),
                element: formData.get('element'),
                match: rangeInput.value
            };

            // Validasi sederhana: pastikan user sudah memilih
            if (!userChoice.vibe || !userChoice.element) {
                alert("Silahkan pilih Vibes dan Element terlebih dahulu!");
                return;
            }

            console.log("Menyimpan Pilihan:", userChoice);

            // Simpan ke LocalStorage via Store.js
            if (typeof TravelStore !== 'undefined') {
                TravelStore.saveUserDNA(userChoice);
                
                // Animasi UI Feedback
                submitBtn.innerText = "Memproses AI... 🤖";
                submitBtn.disabled = true;

                // Redirect ke halaman daftar
                setTimeout(() => {
                    window.location.href = 'daftar.html';
                }, 800);
            } else {
                alert("Error: store.js belum dimuat!");
            }
        });
    }

    // 4. RESET HANDLER (Fitur Tambahan dari Kode 1)
    const resetBtn = document.querySelector('.reset-button');
    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('userChoice')
            document.getElementById('match-val').innerText = 50;
            console.log("Data preferensi di-reset dari memori.");
        });
    }
});