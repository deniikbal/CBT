-- Add indexes untuk frequently queried columns
-- Ini akan speed up queries secara significant

-- Index untuk jadwal_ujian queries
CREATE INDEX IF NOT EXISTS idx_jadwal_ujian_bank_soal_id ON "jadwal_ujian"("bank_soal_id");
CREATE INDEX IF NOT EXISTS idx_jadwal_ujian_created_by ON "jadwal_ujian"("created_by");
CREATE INDEX IF NOT EXISTS idx_jadwal_ujian_is_active ON "jadwal_ujian"("is_active");

-- Index untuk jadwal_ujian_peserta queries (most frequently accessed)
CREATE INDEX IF NOT EXISTS idx_jadwal_ujian_peserta_jadwal_id ON "jadwal_ujian_peserta"("jadwal_ujian_id");
CREATE INDEX IF NOT EXISTS idx_jadwal_ujian_peserta_peserta_id ON "jadwal_ujian_peserta"("peserta_id");
CREATE INDEX IF NOT EXISTS idx_jadwal_ujian_peserta_composite ON "jadwal_ujian_peserta"("jadwal_ujian_id", "peserta_id");

-- Index untuk soal_bank queries
CREATE INDEX IF NOT EXISTS idx_soal_bank_bank_soal_id ON "soal_bank"("bank_soal_id");

-- Index untuk hasil_ujian_peserta queries
CREATE INDEX IF NOT EXISTS idx_hasil_ujian_jadwal_peserta ON "hasil_ujian_peserta"("jadwal_ujian_id", "peserta_id");
CREATE INDEX IF NOT EXISTS idx_hasil_ujian_status ON "hasil_ujian_peserta"("status");
CREATE INDEX IF NOT EXISTS idx_hasil_ujian_jadwal_status ON "hasil_ujian_peserta"("jadwal_ujian_id", "status");

-- Index untuk peserta queries
CREATE INDEX IF NOT EXISTS idx_peserta_kelas_id ON "peserta"("kelas_id");
CREATE INDEX IF NOT EXISTS idx_peserta_is_active ON "peserta"("is_active");
CREATE INDEX IF NOT EXISTS idx_peserta_no_ujian ON "peserta"("no_ujian");

-- Index untuk activity_log queries
CREATE INDEX IF NOT EXISTS idx_activity_log_hasil_ujian_id ON "activity_log"("hasil_ujian_id");
CREATE INDEX IF NOT EXISTS idx_activity_log_peserta_id ON "activity_log"("peserta_id");
