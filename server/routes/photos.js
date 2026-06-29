const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')

const IMAGES_DIR = path.join(__dirname, '../data/images')
fs.mkdirSync(IMAGES_DIR, { recursive: true })

router.post('/upload', (req, res) => {
  const { ref, filename, filecontent } = req.body
  if (!ref || !filecontent) return res.status(400).json({ error: 'ref et filecontent requis' })

  const ext = path.extname(filename || `${ref}.png`) || '.png'
  const filePath = path.join(IMAGES_DIR, `${ref}${ext}`)

  const buffer = Buffer.from(filecontent, 'base64')
  fs.writeFileSync(filePath, buffer)

  res.json({ ok: true, path: `${ref}${ext}` })
})

router.get('/:ref', (req, res) => {
  const { ref } = req.params
  const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

  for (const ext of extensions) {
    const filePath = path.join(IMAGES_DIR, `${ref}${ext}`)
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath)
    }
  }

  res.status(404).json({ error: 'Image non trouvée' })
})

router.delete('/', (req, res) => {
  const files = fs.readdirSync(IMAGES_DIR)
  for (const file of files) {
    fs.unlinkSync(path.join(IMAGES_DIR, file))
  }
  res.json({ deleted: files.length })
})

module.exports = router
