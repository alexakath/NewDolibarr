const express = require('express')
const router = express.Router()
const db = require('../db')

router.post('/', (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code requis.' })

  const row = db.prepare("SELECT value FROM settings WHERE key = 'backoffice_code'").get()
  const storedCode = row?.value || 'ADMIN2025'

  if (code === storedCode) {
    res.json({ ok: true })
  } else {
    res.status(401).json({ error: 'Code incorrect.' })
  }
})

module.exports = router
