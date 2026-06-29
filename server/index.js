require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MODULES } = require('./modules')
const db = require('./db')
const makeResourceRouter = require('./routes/resource')
const { seedSettings } = require('./seeds')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

seedSettings()

Object.entries(MODULES).forEach(([key, mod]) => {
  app.use(`/api/${key}`, makeResourceRouter(key, mod))
})

app.post('/api/import_history', (req, res) => {
  const { type, count, errors } = req.body
  if (!type) return res.status(400).json({ error: 'type requis' })
  const info = db.prepare(
    'INSERT INTO import_history (type, count, errors) VALUES (?, ?, ?)'
  ).run(type, Number(count) || 0, Number(errors) || 0)
  res.json({ id: info.lastInsertRowid })
})

app.use('/api/sync', require('./routes/sync'))
app.use('/api/settings', require('./routes/settings'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/photos', require('./routes/photos'))

app.get('/api/health', (req, res) =>
  res.json({ ok: true, backend: 'newapp-server', db: 'sqlite', modules: Object.keys(MODULES) })
)

app.listen(PORT, () => {
  console.log(`Backend NewApp — http://localhost:${PORT}`)
  console.log(`Modules        : ${Object.keys(MODULES).join(', ')}`)
})
