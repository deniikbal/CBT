// Simple in-memory cache utility
// Dapat di-upgrade ke Redis nanti jika perlu

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // in milliseconds
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map()

  set<T>(key: string, data: T, ttlSeconds: number = 300) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(key: string) {
    this.store.delete(key)
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern)
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
      }
    }
  }

  clear() {
    this.store.clear()
  }

  getStats() {
    return {
      entries: this.store.size,
      keys: Array.from(this.store.keys()),
    }
  }
}

// Export singleton instance
export const cache = new Cache()

// Cache key generators
export const cacheKeys = {
  // Dashboard & Stats (aggressive cache - 15 min)
  dashboardStats: 'dashboard:stats',
  totalPeserta: 'stats:peserta:count',
  totalBankSoal: 'stats:banksoal:count',
  totalJadwal: 'stats:jadwal:count',
  
  // Jadwal (15 min cache)
  jadwal: (jadwalId: string) => `jadwal:${jadwalId}`,
  jadwalList: (createdBy?: string) => `jadwal:list:${createdBy || 'all'}`,
  
  // Soal (15 min cache - expensive query)
  soalBank: (bankSoalId: string) => `soal:${bankSoalId}`,
  soalBankCount: (bankSoalId: string) => `soal:count:${bankSoalId}`,
  
  // Peserta (10 min cache)
  pesertaList: (jadwalId: string) => `peserta:list:${jadwalId}`,
  pesertaDetail: (pesertaId: string) => `peserta:${pesertaId}`,
  
  // Results (5 min cache - more real-time)
  hasilUjian: (hasilId: string) => `hasil:${hasilId}`,
  
  // Settings (10 min cache)
  examSettings: 'exam:browser:settings',
}
