import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("data/siajar.db");

const tables = db.prepare("select name from sqlite_master where type='table'").all();
console.log("TABLES:", JSON.stringify(tables));

const schemaRows = db.prepare("select sql from sqlite_master where type='table' and name='integrations'").all();
console.log("\nSCHEMA integrations:");
schemaRows.forEach(r => console.log(r.sql));

const rows = db.prepare("select * from integrations limit 5").all();
console.log("\nROWS integrations (all cols):");
rows.forEach(r => console.log(JSON.stringify(r)));

// Cek isi kolom JSON jika ada
if (rows.length > 0 && rows[0].data) {
  const data = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
  console.log("\nDATA (parsed):", JSON.stringify(data, null, 2));
}

db.close();
