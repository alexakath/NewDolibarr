const MODULES = {

  employees: {
    orderBy: 'id ASC',
    schema: `
      CREATE TABLE IF NOT EXISTS employees (
        id            INTEGER PRIMARY KEY,
        lastname      TEXT,
        firstname     TEXT,
        gender        TEXT,
        login         TEXT,
        ref_employee  TEXT,
        weeklyhours   REAL,
        poste         TEXT,
        data_json     TEXT,
        synced_at     TEXT DEFAULT (datetime('now'))
      )
    `,
    columns: ['id', 'lastname', 'firstname', 'gender', 'login', 'ref_employee', 'weeklyhours', 'poste', 'data_json'],
    mapRow: (u) => ({
      id:           Number(u.id),
      lastname:     u.lastname ?? null,
      firstname:    u.firstname ?? null,
      gender:       u.gender ?? null,
      login:        u.login ?? null,
      ref_employee: u.ref_employee ?? null,
      weeklyhours:  u.weeklyhours ? Number(u.weeklyhours) : null,
      poste:        u.job ?? u.poste ?? null,
      data_json:    JSON.stringify(u),
    }),
  },

  salaries: {
    orderBy: 'id ASC',
    schema: `
      CREATE TABLE IF NOT EXISTS salaries (
        id        INTEGER PRIMARY KEY,
        fk_user   INTEGER,
        amount    REAL,
        datesp    TEXT,
        dateep    TEXT,
        label     TEXT,
        paye      INTEGER,
        data_json TEXT,
        synced_at TEXT DEFAULT (datetime('now'))
      )
    `,
    columns: ['id', 'fk_user', 'amount', 'datesp', 'dateep', 'label', 'paye', 'data_json'],
    mapRow: (s) => ({
      id:        Number(s.id),
      fk_user:   Number(s.fk_user) || null,
      amount:    Number(s.amount) || 0,
      datesp:    s.datesp ?? null,
      dateep:    s.dateep ?? null,
      label:     s.label ?? null,
      paye:      Number(s.paye) || 0,
      data_json: JSON.stringify(s),
    }),
  },

  import_history: {
    orderBy: 'created_at DESC',
    schema: `
      CREATE TABLE IF NOT EXISTS import_history (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        type       TEXT NOT NULL,
        count      INTEGER NOT NULL DEFAULT 0,
        errors     INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `,
  },

  settings: {
    orderBy: 'key ASC',
    schema: `
      CREATE TABLE IF NOT EXISTS settings (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `,
  },

  jours_feries: {
    orderBy: 'date ASC',
    schema: `
      CREATE TABLE IF NOT EXISTS jours_feries (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        date       TEXT NOT NULL,
        libelle    TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `,
  },
}

module.exports = { MODULES }
