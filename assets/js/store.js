const TravelStore = {
    // Path Relatif Standar Web
    JSON_PATH: 'assets/data/destinations.json',

    async getAllDestinations() {
        console.log("⚡ STORE: Memulai pengambilan data...");
        try {
            // Cek Cache
            const cached = sessionStorage.getItem('travel_cache_v2');
            if (cached) {
                console.log("⚡ STORE: Data dimuat dari Cache.");
                return JSON.parse(cached);
            }

            // Fetch Data
            const response = await fetch(this.JSON_PATH);
            if (!response.ok) {
                throw new Error(`Gagal Fetch! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`⚡ STORE: Berhasil mengunduh ${data.length} data destinasi.`);
            
            // Simpan Cache
            sessionStorage.setItem('travel_cache_v2', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error("💀 STORE CRITICAL ERROR:", error);
            alert("GAGAL MEMUAT DATA! Pastikan Anda menggunakan Live Server atau path JSON benar.");
            return [];
        }
    },

    saveUserDNA(dna) {
        localStorage.setItem('user_dna', JSON.stringify(dna));
    },

    getUserDNA() {
        const saved = localStorage.getItem('user_dna');
        // Default Match Score kita set 0 dulu biar dia nyari apa aja, nanti di filter Engine
        return saved ? JSON.parse(saved) : { vibe: 'serenity', element: 'cerulean', match: 50 };
    },

    saveDisplayLimit(limit) {
        localStorage.setItem('display_limit', limit);
    },

    getDisplayLimit() {
        return parseInt(localStorage.getItem('display_limit')) || 12;
    },

    async getDestinationById(id) {
        const all = await this.getAllDestinations();
        // Konversi ke string untuk keamanan perbandingan
        return all.find(item => String(item.id) === String(id));
    }
};
                        
