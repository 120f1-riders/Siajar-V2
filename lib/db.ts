import { createClient, type Client, type InStatement, type ResultSet, type Transaction } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./password";

export type Row = Record<string, unknown>;
type Arg = string | number | bigint | null | boolean | Uint8Array;
type Runner = (stmt: InStatement) => Promise<ResultSet>;

function toRows(rs: ResultSet): Row[] {
  return rs.rows.map((r) => {
    const out: Row = {};
    rs.columns.forEach((col, i) => {
      out[col] = r[i];
    });
    return out;
  });
}

class Statement {
  constructor(
    private run_: Runner,
    private sql: string,
    private ready: Promise<void>
  ) {}

  private async exec(args: Arg[]) {
    await this.ready;
    return this.run_({ sql: this.sql, args: args.map((a) => (a === undefined ? null : a)) });
  }

  async get(...args: Arg[]): Promise<Row | undefined> {
    return toRows(await this.exec(args))[0];
  }

  async all(...args: Arg[]): Promise<Row[]> {
    return toRows(await this.exec(args));
  }

  async run(...args: Arg[]): Promise<{ changes: number; lastInsertRowid: number }> {
    const rs = await this.exec(args);
    return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid ?? 0) };
  }
}

export class Db {
  constructor(
    private runner: { execute: Runner },
    private ready: Promise<void>
  ) {}

  prepare(sql: string) {
    return new Statement((s) => this.runner.execute(s), sql, this.ready);
  }

  async batch(items: [string, ...Arg[]][]) {
    await this.ready;
    await (this.runner as Client).batch(
      items.map(([sql, ...args]) => ({ sql, args })),
      "write"
    );
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    await this.ready;
    const tx: Transaction = await (this.runner as Client).transaction("write");
    try {
      const result = await fn(new Db(tx, Promise.resolve()));
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.close();
    }
  }
}

const SCHEMA = `
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
`;

const DEFAULT_SETTINGS: Record<string, string> = {
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

async function init(client: Client, local: boolean) {
  if (local) await client.execute("PRAGMA foreign_keys = ON");
  await client.executeMultiple(SCHEMA);

  const count = await client.execute("SELECT COUNT(*) AS n FROM users");
  const now = new Date().toISOString();
  const stmts: InStatement[] = [];
  if (Number(count.rows[0]?.[0] ?? 0) === 0) {
    const sql = `INSERT OR IGNORE INTO users (username, nama, role, nip, password_hash, aktif, created_at)
                 VALUES (?, ?, ?, ?, ?, 1, ?)`;
    stmts.push(
      { sql, args: ["admin", "Administrator SIAJAR", "admin", "", hashPassword("admin123"), now] },
      { sql, args: ["kepala1", "Drs. H. Muhammad Ridwan, M.Pd.", "kepala", "19700512 199803 1 004", hashPassword("kepala123"), now] },
      { sql, args: ["guru1", "Ahmad Fauzi, S.Pd.", "guru", "19880417 201503 1 002", hashPassword("guru123"), now] }
    );
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    stmts.push({ sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: [key, value] });
  }
  stmts.push("INSERT OR IGNORE INTO integrations (id) VALUES (1)");
  await client.batch(stmts, "write");
}

function createDb(): Db {
  let url = process.env.TURSO_DATABASE_URL;
  const local = !url;
  if (!url) {
    if (process.env.VERCEL) {
      throw new Error("TURSO_DATABASE_URL belum diatur di Environment Variables Vercel.");
    }
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    url = `file:${path.join(dataDir, "siajar.db")}`;
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const ready = init(client, local);
  ready.catch((err) => {
    console.error("Gagal menyiapkan database", err);
    globalForDb.__siajarDb = undefined;
  });
  return new Db(client, ready);
}

const globalForDb = globalThis as unknown as { __siajarDb?: Db };

export function getDb(): Db {
  if (!globalForDb.__siajarDb) globalForDb.__siajarDb = createDb();
  return globalForDb.__siajarDb;
}
