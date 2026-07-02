const express = require('express')
const db = require('../db')

const router = express.Router()

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM jours_feries ORDER BY date ASC').all()
  res.json(rows)
})

router.post('/', (req, res) => {
  const { date, libelle } = req.body
  if (!date || !libelle) return res.status(400).json({ error: 'date et libellé requis' })
  const info = db.prepare('INSERT INTO jours_feries (date, libelle) VALUES (?, ?)').run(date, libelle)
  res.status(201).json({ id: info.lastInsertRowid, date, libelle })
})

router.put('/:id', (req, res) => {
  const { date, libelle } = req.body
  if (!date || !libelle) return res.status(400).json({ error: 'date et libellé requis' })
  const info = db.prepare('UPDATE jours_feries SET date = ?, libelle = ? WHERE id = ?').run(date, libelle, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Jour férié introuvable' })
  res.json({ id: Number(req.params.id), date, libelle })
})

router.delete('/', (req, res) => {
  const info = db.prepare('DELETE FROM jours_feries').run()
  res.json({ deleted: info.changes })
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM jours_feries WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Jour férié introuvable' })
  res.json({ deleted: info.changes })
})

module.exports = router
