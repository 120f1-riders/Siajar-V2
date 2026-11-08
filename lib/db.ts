import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./password";

const globalForDb = globalThis as unknown as { __siajarDb?: DatabaseSync };

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createDb(): DatabaseSync {
  const dataDir = path.join(process.cwd(), "data");
  ensureDir(dataDir);
  ensureDir(path.join(process.cwd(), "public", "uploads"));

  const db = new DatabaseSync(path.join(dataDir, "siajar.db"));
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'guru',
      nip TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      aktif INTEGER NOT NULL DEFAULT 1,
      harus_ganti_password INTEGER NOT NULL DEFAULT 0,
      ttd_path TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reset_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      keterangan TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      handled_at TEXT,
      handled_by INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      ai_api_key TEXT NOT NULL DEFAULT '',
      ai_api_base TEXT NOT NULL DEFAULT '',
      ai_model TEXT NOT NULL DEFAULT '',
      google_client_id TEXT NOT NULL DEFAULT '',
      google_client_secret TEXT NOT NULL DEFAULT '',
      google_refresh_token TEXT NOT NULL DEFAULT '',
      google_email TEXT NOT NULL DEFAULT '',
      google_connected_at TEXT,
      google_folder_id TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS paket (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guru_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mapel TEXT NOT NULL DEFAULT '',
      kelas TEXT NOT NULL DEFAULT '',
      semester TEXT NOT NULL DEFAULT 'Ganjil',
      tahun_ajaran TEXT NOT NULL DEFAULT '',
      kurikulum TEXT NOT NULL DEFAULT 'merdeka',
      jenis_penilaian TEXT NOT NULL DEFAULT 'Asesmen Sumatif Akhir Semester',
      alokasi_waktu TEXT NOT NULL DEFAULT '90 menit',
      petunjuk TEXT NOT NULL DEFAULT '',
      cetak_kunci INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      catatan_kepala TEXT,
      signed_by INTEGER,
      signed_at TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS butir (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paket_id INTEGER NOT NULL REFERENCES paket(id) ON DELETE CASCADE,
      nomor INTEGER NOT NULL,
      bentuk TEXT NOT NULL DEFAULT 'pg',
      materi TEXT NOT NULL DEFAULT '',
      acuan TEXT NOT NULL DEFAULT '',
      indikator TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'C2',
      soal TEXT NOT NULL DEFAULT '',
      opsi TEXT NOT NULL DEFAULT '[]',
      kunci TEXT NOT NULL DEFAULT '',
      skor INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_butir_paket ON butir(paket_id);
    CREATE INDEX IF NOT EXISTS idx_paket_guru ON paket(guru_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  seed(db);
  return db;
}

function seed(db: DatabaseSync) {
  const now = new Date().toISOString();
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };

  if (count.n === 0) {
    const insert = db.prepare(
      `INSERT INTO users (username, nama, role, nip, password_hash, aktif, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`
    );
    insert.run(
      "admin",
      "Administrator SIAJAR",
      "admin",
      "",
      hashPassword("admin123"),
      now
    );
    insert.run(
      "kepala1",
      "Drs. H. Muhammad Ridwan, M.Pd.",
      "kepala",
      "19700512 199803 1 004",
      hashPassword("kepala123"),
      now
    );
    insert.run(
      "guru1",
      "Ahmad Fauzi, S.Pd.",
      "guru",
      "19880417 201503 1 002",
      hashPassword("guru123"),
      now
    );
  }

  const defaults: Record<string, string> = {
    baris1: "KEMENTERIAN AGAMA REPUBLIK INDONESIA",
    baris2: "KANTOR KEMENTERIAN AGAMA KABUPATEN/KOTA",
    nama_madrasah: "NAMA MADRASAH",
    alamat: "Jalan Pendidikan Nomor 1, Kecamatan ..., Kabupaten/Kota ...",
    kontak: "Telepon (000) 000000",
    website: "www.madrasah.sch.id",
    kota: "Kota Madrasah",
    kepala_nama: "Drs. H. Muhammad Ridwan, M.Pd.",
    kepala_nip: "19700512 199803 1 004",
    kepala_ttd_path: "",
    logo_path: "",
    tahun_ajaran: "2026/2027",
    semester: "Ganjil",
  };

  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  for (const [key, value] of Object.entries(defaults)) {
    insertSetting.run(key, value);
  }
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__siajarDb) {
    globalForDb.__siajarDb = createDb();
  }
  return globalForDb.__siajarDb;
}
