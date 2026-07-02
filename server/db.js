const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { MODULES } = require('./modules')

const DATA_DIR = path.join(__dirname, 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'newapp.db'))
db.pragma('journal_mode = WAL')

Object.values(MODULES).forEach(mod => db.exec(mod.schema))

// Migrations : ajout de colonnes sur tables existantes
const migrations = [
  `ALTER TABLE employees ADD COLUMN poste TEXT`,
]
for (const sql of migrations) {
  try { db.exec(sql) } catch (_) {}
}

module.exports = db
