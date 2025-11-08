import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const difficultyEnum = pgEnum('difficulty', ['EASY', 'MEDIUM', 'HARD']);
export const resultStatusEnum = pgEnum('result_status', ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED']);
export const jawabanBenarEnum = pgEnum('jawaban_benar', ['A', 'B', 'C', 'D', 'E']);
export const sourceTypeEnum = pgEnum('source_type', ['MANUAL', 'GOOGLE_FORM']);

// User Table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  role: roleEnum('role').notNull().default('USER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Question Table
export const questions = pgTable('questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON string of options
  correctAnswer: text('correct_answer').notNull(),
  category: text('category'),
  difficulty: difficultyEnum('difficulty').notNull().default('MEDIUM'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Exam Table
export const exams = pgTable('exams', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(), // in minutes
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ExamQuestion Table (Join Table)
export const examQuestions = pgTable('exam_questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
});

// ExamResult Table
export const examResults = pgTable('exam_results', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  answers: text('answers').notNull(), // JSON string of user answers
  startedAt: timestamp('started_at').notNull(),
  submittedAt: timestamp('submitted_at').notNull(),
  status: resultStatusEnum('status').notNull().default('IN_PROGRESS'),
});

// Jurusan Table
export const jurusan = pgTable('jurusan', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  kodeJurusan: text('kode_jurusan').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Kelas Table
export const kelas = pgTable('kelas', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  jurusanId: text('jurusan_id').notNull().references(() => jurusan.id, { onDelete: 'cascade' }),
  teacher: text('teacher'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Peserta Table
export const peserta = pgTable('peserta', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  noUjian: text('no_ujian').notNull().unique(),
  password: text('password').notNull(),
  unhashedPassword: text('unhashed_password'), // Plain password for exam card printing
  kelasId: text('kelas_id').notNull().references(() => kelas.id, { onDelete: 'cascade' }),
  jurusanId: text('jurusan_id').notNull().references(() => jurusan.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Mata Pelajaran Table
export const mataPelajaran = pgTable('mata_pelajaran', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  kodeMatpel: text('kode_matpel').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Bank Soal Table
export const bankSoal = pgTable('bank_soal', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  kodeBankSoal: text('kode_banksoal').notNull().unique(),
  matpelId: text('matpel_id').notNull().references(() => mataPelajaran.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  jumlahSoal: integer('jumlah_soal').notNull().default(0),
  sourceType: sourceTypeEnum('source_type').notNull().default('MANUAL'),
  googleFormUrl: text('google_form_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Soal Bank Table
export const soalBank = pgTable('soal_bank', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bankSoalId: text('bank_soal_id').notNull().references(() => bankSoal.id, { onDelete: 'cascade' }),
  nomorSoal: integer('nomor_soal').notNull(),
  soal: text('soal').notNull(),
  pilihanA: text('pilihan_a').notNull(),
  pilihanB: text('pilihan_b').notNull(),
  pilihanC: text('pilihan_c').notNull(),
  pilihanD: text('pilihan_d').notNull(),
  pilihanE: text('pilihan_e'),
  jawabanBenar: jawabanBenarEnum('jawaban_benar').notNull(),
  pembahasan: text('pembahasan'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Jadwal Ujian Table
export const jadwalUjian = pgTable('jadwal_ujian', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  namaUjian: text('nama_ujian').notNull(),
  bankSoalId: text('bank_soal_id').notNull().references(() => bankSoal.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  kelasId: text('kelas_id').references(() => kelas.id, { onDelete: 'set null' }),
  tanggalUjian: timestamp('tanggal_ujian').notNull(),
  jamMulai: text('jam_mulai').notNull(),
  durasi: integer('durasi').notNull(),
  minimumPengerjaan: integer('minimum_pengerjaan'),
  acakSoal: boolean('acak_soal').notNull().default(false),
  acakOpsi: boolean('acak_opsi').notNull().default(false),
  tampilkanNilai: boolean('tampilkan_nilai').notNull().default(true),
  resetPelanggaranOnEnable: boolean('reset_pelanggaran_on_enable').notNull().default(true), // Reset counter saat enable account
  autoSubmitOnViolation: boolean('auto_submit_on_violation').notNull().default(false), // Auto submit saat 5x pelanggaran
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Exam Browser Settings Table (Global Settings)
export const examBrowserSettings = pgTable('exam_browser_settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  isEnabled: boolean('is_enabled').notNull().default(false),
  allowedBrowserPattern: text('allowed_browser_pattern').default('cbt-'),
  maxViolations: integer('max_violations').default(5),
  allowMultipleSessions: boolean('allow_multiple_sessions').notNull().default(false),
  blockDevtools: boolean('block_devtools').notNull().default(true),
  blockScreenshot: boolean('block_screenshot').notNull().default(true),
  blockRightClick: boolean('block_right_click').notNull().default(true),
  blockCopyPaste: boolean('block_copy_paste').notNull().default(true),
  requireFullscreen: boolean('require_fullscreen').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Jadwal Ujian Peserta Table (Join Table)
export const jadwalUjianPeserta = pgTable('jadwal_ujian_peserta', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jadwalUjianId: text('jadwal_ujian_id').notNull().references(() => jadwalUjian.id, { onDelete: 'cascade' }),
  pesertaId: text('peserta_id').notNull().references(() => peserta.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Hasil Ujian Peserta Table
export const hasilUjianPeserta = pgTable('hasil_ujian_peserta', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jadwalUjianId: text('jadwal_ujian_id').notNull().references(() => jadwalUjian.id, { onDelete: 'cascade' }),
  pesertaId: text('peserta_id').notNull().references(() => peserta.id, { onDelete: 'cascade' }),
  waktuMulai: timestamp('waktu_mulai').notNull(),
  waktuSelesai: timestamp('waktu_selesai'),
  jawaban: text('jawaban').notNull(), // JSON string
  skor: integer('skor'),
  skorMaksimal: integer('skor_maksimal'),
  status: text('status').notNull().default('in_progress'), // in_progress, submitted
  sessionId: text('session_id'), // untuk single session lock
  ipAddress: text('ip_address'), // IP address saat mulai
  soalOrder: text('soal_order'), // JSON array of soal IDs dalam urutan yang sudah diacak (untuk consistency)
  optionMappings: text('option_mappings'), // JSON object: { soalId: { A: 'C', B: 'A', ... } } - mapping shuffle opsi
  kunciJawabanSnapshot: text('kunci_jawaban_snapshot'), // JSON object: { soalId: 'A'/'B'/'C'/'D'/'E' } - snapshot kunci jawaban saat ujian dimulai
  jumlahPelanggaran: integer('jumlah_pelanggaran').notNull().default(0), // counter untuk tab blur violations
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Activity Log Table
export const activityLogEnum = pgEnum('activity_type', [
  'TAB_BLUR',
  'EXIT_FULLSCREEN', 
  'ATTEMPTED_DEVTOOLS',
  'SCREENSHOT_ATTEMPT',
  'PAGE_REFRESH',
  'ANSWER_CHANGE',
  'RIGHT_CLICK',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'SESSION_VIOLATION',
  'FORCE_SUBMIT'
]);

export const activityLog = pgTable('activity_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  hasilUjianId: text('hasil_ujian_id').notNull().references(() => hasilUjianPeserta.id, { onDelete: 'cascade' }),
  pesertaId: text('peserta_id').notNull().references(() => peserta.id, { onDelete: 'cascade' }),
  activityType: activityLogEnum('activity_type').notNull(),
  count: integer('count').default(1), // jumlah kejadian (untuk blur, dll)
  metadata: text('metadata'), // JSON string untuk data tambahan
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  examResults: many(examResults),
  createdExams: many(exams),
  createdBankSoal: many(bankSoal),
  createdJadwalUjian: many(jadwalUjian),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  examQuestions: many(examQuestions),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  creator: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  examQuestions: many(examQuestions),
  results: many(examResults),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, {
    fields: [examQuestions.examId],
    references: [exams.id],
  }),
  question: one(questions, {
    fields: [examQuestions.questionId],
    references: [questions.id],
  }),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  user: one(users, {
    fields: [examResults.userId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [examResults.examId],
    references: [exams.id],
  }),
}));

export const jurusanRelations = relations(jurusan, ({ many }) => ({
  kelas: many(kelas),
  peserta: many(peserta),
}));

export const kelasRelations = relations(kelas, ({ one, many }) => ({
  jurusan: one(jurusan, {
    fields: [kelas.jurusanId],
    references: [jurusan.id],
  }),
  peserta: many(peserta),
}));

export const pesertaRelations = relations(peserta, ({ one }) => ({
  kelas: one(kelas, {
    fields: [peserta.kelasId],
    references: [kelas.id],
  }),
  jurusan: one(jurusan, {
    fields: [peserta.jurusanId],
    references: [jurusan.id],
  }),
}));

export const mataPelajaranRelations = relations(mataPelajaran, ({ many }) => ({
  bankSoal: many(bankSoal),
}));

export const bankSoalRelations = relations(bankSoal, ({ one, many }) => ({
  creator: one(users, {
    fields: [bankSoal.createdBy],
    references: [users.id],
  }),
  mataPelajaran: one(mataPelajaran, {
    fields: [bankSoal.matpelId],
    references: [mataPelajaran.id],
  }),
  soal: many(soalBank),
}));

export const soalBankRelations = relations(soalBank, ({ one }) => ({
  bankSoal: one(bankSoal, {
    fields: [soalBank.bankSoalId],
    references: [bankSoal.id],
  }),
}));

export const jadwalUjianRelations = relations(jadwalUjian, ({ one, many }) => ({
  creator: one(users, {
    fields: [jadwalUjian.createdBy],
    references: [users.id],
  }),
  bankSoal: one(bankSoal, {
    fields: [jadwalUjian.bankSoalId],
    references: [bankSoal.id],
  }),
  kelas: one(kelas, {
    fields: [jadwalUjian.kelasId],
    references: [kelas.id],
  }),
  peserta: many(jadwalUjianPeserta),
}));

export const jadwalUjianPesertaRelations = relations(jadwalUjianPeserta, ({ one }) => ({
  jadwalUjian: one(jadwalUjian, {
    fields: [jadwalUjianPeserta.jadwalUjianId],
    references: [jadwalUjian.id],
  }),
  peserta: one(peserta, {
    fields: [jadwalUjianPeserta.pesertaId],
    references: [peserta.id],
  }),
}));

export const hasilUjianPesertaRelations = relations(hasilUjianPeserta, ({ one, many }) => ({
  jadwalUjian: one(jadwalUjian, {
    fields: [hasilUjianPeserta.jadwalUjianId],
    references: [jadwalUjian.id],
  }),
  peserta: one(peserta, {
    fields: [hasilUjianPeserta.pesertaId],
    references: [peserta.id],
  }),
  activityLogs: many(activityLog),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  hasilUjian: one(hasilUjianPeserta, {
    fields: [activityLog.hasilUjianId],
    references: [hasilUjianPeserta.id],
  }),
  peserta: one(peserta, {
    fields: [activityLog.pesertaId],
    references: [peserta.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;

export type ExamQuestion = typeof examQuestions.$inferSelect;
export type NewExamQuestion = typeof examQuestions.$inferInsert;

export type ExamResult = typeof examResults.$inferSelect;
export type NewExamResult = typeof examResults.$inferInsert;

export type Jurusan = typeof jurusan.$inferSelect;
export type NewJurusan = typeof jurusan.$inferInsert;

export type Kelas = typeof kelas.$inferSelect;
export type NewKelas = typeof kelas.$inferInsert;

export type Peserta = typeof peserta.$inferSelect;
export type NewPeserta = typeof peserta.$inferInsert;

export type MataPelajaran = typeof mataPelajaran.$inferSelect;
export type NewMataPelajaran = typeof mataPelajaran.$inferInsert;

export type BankSoal = typeof bankSoal.$inferSelect;
export type NewBankSoal = typeof bankSoal.$inferInsert;

export type SoalBank = typeof soalBank.$inferSelect;
export type NewSoalBank = typeof soalBank.$inferInsert;

export type JadwalUjian = typeof jadwalUjian.$inferSelect;
export type NewJadwalUjian = typeof jadwalUjian.$inferInsert;

export type ExamBrowserSettings = typeof examBrowserSettings.$inferSelect;
export type NewExamBrowserSettings = typeof examBrowserSettings.$inferInsert;

export type JadwalUjianPeserta = typeof jadwalUjianPeserta.$inferSelect;
export type NewJadwalUjianPeserta = typeof jadwalUjianPeserta.$inferInsert;

export type HasilUjianPeserta = typeof hasilUjianPeserta.$inferSelect;
export type NewHasilUjianPeserta = typeof hasilUjianPeserta.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
