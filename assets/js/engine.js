/**
 * TRAVEL AI ENGINE - VECTOR VERSION 4 (PERFECTED SCORE)
 * Algorithms: Weighted TF + Cosine Similarity + High-Sensitivity Normalization
 */

const TravelEngine = {
    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 2);
    },

    getMapping() {
        return {
            vibe: {
                serenity: ['relaksasi', 'spa', 'tenang', 'sejuk', 'alam', 'damai', 'sunyi', 'healing', 'hening'],
                adrenaline: ['petualangan', 'snorkeling', 'diving', 'mendaki', 'trekking', 'liar', 'ekstrim', 'seru', 'tantangan'],
                legacy: ['budaya', 'sejarah', 'museum', 'candi', 'situs', 'edukasi', 'warisan', 'kuno', 'tradisional'],
                ecstasy: ['belanja', 'kuliner', 'kota', 'modern', 'hiburan', 'malam', 'mall', 'fashion', 'gemerlap']
            },
            element: {
                cerulean: ['pantai', 'laut', 'air', 'maritim', 'bahari', 'pulau', 'karang', 'snorkeling', 'diving', 'selam'],
                emerald: ['hutan', 'kebun', 'sawah', 'hijau', 'taman', 'alam', 'rimba', 'pedesaan'],
                titan: ['gunung', 'bukit', 'tebing', 'dataran', 'kawah', 'puncak', 'batu', 'lereng'],
                neon: ['kota', 'gedung', 'pasar', 'mall', 'shopping', 'metropolitan', 'pusat', 'arsitektur']
            }
        };
    },

    getQueryKeywords(dna) {
        const map = this.getMapping();
        return [...(map.vibe[dna.vibe] || []), ...(map.element[dna.element] || [])];
    },

    checkConstraints(dest, dna) {
        const categories = dest.kategori.join(' ').toLowerCase();
        const natureDNA = ['serenity', 'emerald', 'titan'];
        const urbanKeywords = ['mall', 'belanja', 'shopping', 'kota'];
        if (natureDNA.includes(dna.vibe) || natureDNA.includes(dna.element)) {
            if (urbanKeywords.some(word => categories.includes(word))) return false;
        }
        return true;
    },

    // Pemberian Bobot Vektor yang lebih agresif
    createWeightedVector(dest) {
        const vector = {};
        // Kategori diberi bobot super (25) agar dominan
        dest.kategori.forEach(cat => { this.tokenize(cat).forEach(word => { vector[word] = (vector[word] || 0) + 25; }); });
        // Aktivitas diberi bobot tinggi (12)
        dest.aktivitas.forEach(act => { this.tokenize(act).forEach(word => { vector[word] = (vector[word] || 0) + 12; }); });
        // Deskripsi sebagai pelengkap (1)
        this.tokenize(dest.deskripsi).forEach(word => { vector[word] = (vector[word] || 0) + 1; });
        return vector;
    },

    calculateCosineSim(destVector, queryKeywords) {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = queryKeywords.length; 
        for (let word in destVector) { magnitudeA += Math.pow(destVector[word], 2); }
        magnitudeA = Math.sqrt(magnitudeA);
        queryKeywords.forEach(word => { if (destVector[word]) dotProduct += destVector[word] * 1; });
        
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        
        const similarity = dotProduct / (magnitudeA * Math.sqrt(magnitudeB));
        
        // MULTIPLIER DINAIKKAN KE 350 (Agar 100% lebih mudah tercapai)
        let finalScore = Math.round(similarity * 350); 
        return Math.min(finalScore, 100);
    },

    calculateScore(dest, dna) {
        if (!this.checkConstraints(dest, dna)) return 0;
        return this.calculateCosineSim(this.createWeightedVector(dest), this.getQueryKeywords(dna));
    },

    async processRecommendations() {
        const data = await TravelStore.getAllDestinations();
        const dna = TravelStore.getUserDNA();
        if (!data || !data.length) return [];
        const scoredData = data.map(dest => ({ ...dest, matchScore: this.calculateScore(dest, dna) }));
        const threshold = parseInt(dna.match) || 50;
        return scoredData.filter(d => d.matchScore >= threshold).sort((a, b) => b.matchScore - a.matchScore);
    },

    async getSimilarDestinations(currentId) {
        const allData = await TravelStore.getAllDestinations();
        const current = allData.find(i => String(i.id) === String(currentId));
        if (!current) return [];
        const currentKeywords = Object.keys(this.createWeightedVector(current));
        return allData
            .filter(item => String(item.id) !== String(currentId))
            .map(item => {
                const score = this.calculateCosineSim(this.createWeightedVector(item), currentKeywords);
                return { ...item, similarity: score };
            })
            .filter(item => item.similarity > 5)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3);
    }
};
