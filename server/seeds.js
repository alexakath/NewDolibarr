const db = require('./db')

function seedSettings() {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  insert.run('backoffice_code', 'ADMIN2025')
}

module.exports = { seedSettings }
