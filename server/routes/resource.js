const express = require('express')
const db = require('../db')

const makeResourceRouter = (key, mod) => {
  const router = express.Router()
  const orderBy = mod.orderBy || 'id DESC'

  router.get('/', (req, res) =>
    res.json(db.prepare(`SELECT * FROM ${key} ORDER BY ${orderBy}`).all())
  )

  router.get('/count', (req, res) =>
    res.json(db.prepare(`SELECT COUNT(*) as count FROM ${key}`).get())
  )

  router.delete('/', (req, res) => {
    const info = db.prepare(`DELETE FROM ${key}`).run()
    res.json({ deleted: info.changes })
  })

  return router
}

module.exports = makeResourceRouter
