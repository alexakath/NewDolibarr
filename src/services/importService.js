import Papa from 'papaparse'
import JSZip from 'jszip'
import { apiFetch } from '../api/dolibarr'
import { backendFetch } from '../api/backend'

// ─── Registry ─────────────────────────────────────────────────────────────────

class ImportRegistry {
  constructor() {
    this.data = {}
  }

  set(category, key, value) {
    if (!this.data[category]) this.data[category] = {}
    this.data[category][String(key)] = value
  }

  get(category, key) {
    return this.data[category]?.[String(key)] ?? null
  }

  has(category, key) {
    return !!this.data[category]?.[String(key)]
  }
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

const normalize = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_]/g, '')

export function detectDelimiter(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const firstLine = e.target.result.split('\n')[0]
      const candidates = [';', ',', '|', '\t']
      let best = ';', bestCount = 0
      for (const sep of candidates) {
        const count = firstLine.split(sep).length - 1
        if (count > bestCount) { bestCount = count; best = sep }
      }
      resolve(best)
    }
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'))
    reader.readAsText(file)
  })
}

export function parseCsvFile(file, delimiter) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) reject(new Error(`Erreur CSV: ${results.errors[0].message}`))
        else resolve(results.data)
      },
      error: (err) => reject(err),
    })
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCi(row, ...keys) {
  for (const key of keys) {
    for (const [k, v] of Object.entries(row)) {
      if (normalize(k) === normalize(key) && v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim()
      }
    }
  }
  return ''
}

function parseCsvFloat(str) {
  return parseFloat(String(str || '0').replace(',', '.').trim()) || 0
}

// DD/MM/YYYY → YYYY-MM-DD  ou  DD/MM/YY → 20YY-MM-DD
function parseDate(dateStr) {
  if (!dateStr) return null
  const trimmed = dateStr.trim()

  let m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/)
  if (m) {
    const [, d, mo, y] = m
    return `20${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

// {["08/03/26",480],["08/03/26",300]} → [{ date, amount }, ...]
function parsePayments(str) {
  if (!str || !str.trim()) return []
  const payments = []
  const regex = /\["([^"]+)",\s*([\d.,]+)\]/g
  let match
  while ((match = regex.exec(str)) !== null) {
    const date = parseDate(match[1])
    const amount = parseCsvFloat(match[2])
    if (date && amount > 0) {
      payments.push({ date, amount })
    }
  }
  return payments
}

// ─── Import Employés ──────────────────────────────────────────────────────────

async function importEmployees(rows, registry, onProgress) {
  const results = { success: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const ref = getCi(row, 'ref_employe')

    if (!ref) {
      results.errors.push({ line: i + 2, message: 'ref_employe manquant', row })
      onProgress?.(Math.round(((i + 1) / rows.length) * 100), results)
      continue
    }

    if (registry.has('employees', ref)) {
      results.success++
      onProgress?.(Math.round(((i + 1) / rows.length) * 100), results)
      continue
    }

    try {
      const body = {
        login: getCi(row, 'identifiant'),
        lastname: getCi(row, 'nom'),
        password: getCi(row, 'mdp'),
        employee: 1,
        ref_employee: ref,
      }

      const genre = getCi(row, 'genre').toLowerCase()
      if (genre === 'homme') body.gender = 'man'
      else if (genre === 'femme') body.gender = 'woman'

      const heures = getCi(row, 'heure_travail_semaine')
      if (heures) body.weeklyhours = parseCsvFloat(heures)

      const created = await apiFetch('/users', { method: 'POST', body })
      const id = typeof created === 'object' ? created.id : created
      registry.set('employees', ref, { id: Number(id) })
      results.success++
    } catch (err) {
      results.errors.push({ line: i + 2, message: err.message, row })
    }
    onProgress?.(Math.round(((i + 1) / rows.length) * 100), results)
  }

  return results
}

// ─── Import Salaires + Paiements ──────────────────────────────────────────────

async function importSalaries(rows, registry, onProgress) {
  const results = { success: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const refSalaire = getCi(row, 'ref_salaire')
    const refEmploye = getCi(row, 'ref_employe')

    if (!refSalaire) {
      results.errors.push({ line: i + 2, message: 'ref_salaire manquant', row })
      onProgress?.(Math.round(((i + 1) / rows.length) * 100), results)
      continue
    }

    const employee = registry.get('employees', refEmploye)
    if (!employee) {
      results.errors.push({ line: i + 2, message: `Employé ref "${refEmploye}" introuvable — importer d'abord les employés`, row })
      onProgress?.(Math.round(((i + 1) / rows.length) * 100), results)
      continue
    }

    try {
      const body = {
        fk_user: employee.id,
        amount: parseCsvFloat(getCi(row, 'montant')),
        datesp: parseDate(getCi(row, 'date_debut')),
        dateep: parseDate(getCi(row, 'date_fin')),
        label: `Salaire #${refSalaire}`,
      }

      const created = await apiFetch('/salaries', { method: 'POST', body })
      const salaryId = typeof created === 'object' ? created.id : created
      registry.set('salaries', refSalaire, { id: Number(salaryId) })

      const payments = parsePayments(getCi(row, 'paiement'))
      for (const payment of payments) {
        await apiFetch(`/salaries/${salaryId}/payments`, {
          method: 'POST',
          body: {
            datepaye: payment.date,
            paiementtype: 4,
            chid: 0,
            amounts: { [salaryId]: payment.amount },
          },
        })
      }

      results.success++
    } catch (err) {
      results.errors.push({ line: i + 2, message: err.message, row })
    }
    onProgress?.(Math.round(((i + 1) / rows.length) * 100), results)
  }

  return results
}

// ─── Import Images (ZIP) ──────────────────────────────────────────────────────

const SUPPORTED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'])

async function importImages(zipFile, registry, onProgress) {
  const results = { success: 0, errors: [], warnings: [] }

  const zip = await JSZip.loadAsync(zipFile)
  const imageEntries = Object.values(zip.files).filter(f => {
    if (f.dir) return false
    if (f.name.startsWith('__MACOSX/')) return false
    const basename = f.name.split('/').pop()
    if (basename.startsWith('._')) return false
    const ext = basename.split('.').pop().toLowerCase()
    return SUPPORTED_IMAGE_EXTS.has(ext)
  })

  if (imageEntries.length === 0) {
    results.warnings.push({ message: 'Aucune image trouvée dans le ZIP' })
    return results
  }

  for (let i = 0; i < imageEntries.length; i++) {
    const entry = imageEntries[i]
    const basename = entry.name.split('/').pop()
    const dotIdx = basename.lastIndexOf('.')
    const refEmploye = dotIdx > 0 ? basename.slice(0, dotIdx) : basename

    const employee = registry.get('employees', refEmploye)
    if (!employee) {
      results.warnings.push({ message: `"${basename}" : aucun employé ref "${refEmploye}" trouvé — image ignorée` })
      onProgress?.(Math.round(((i + 1) / imageEntries.length) * 100), results)
      continue
    }

    try {
      const base64 = await entry.async('base64')

      await backendFetch('/photos/upload', {
        method: 'POST',
        body: {
          ref: refEmploye,
          filename: basename,
          filecontent: base64,
        },
      })

      results.success++
    } catch (err) {
      results.errors.push({ message: `"${basename}" : ${err.message}` })
    }
    onProgress?.(Math.round(((i + 1) / imageEntries.length) * 100), results)
  }

  return results
}

// ─── Orchestrateur ────────────────────────────────────────────────────────────

export async function runImport(employeeFile, salaryFile, zipFile, onProgress) {
  const registry = new ImportRegistry()
  const report = {}

  onProgress?.('parsing', 'Analyse des fichiers CSV...')
  const empDelimiter = await detectDelimiter(employeeFile)
  const salDelimiter = await detectDelimiter(salaryFile)
  const employeeRows = await parseCsvFile(employeeFile, empDelimiter)
  const salaryRows = await parseCsvFile(salaryFile, salDelimiter)

  onProgress?.('employees', 'Import des employés...', 0)
  report.employees = await importEmployees(employeeRows, registry, (pct, results) => {
    onProgress?.('employees', `Import des employés... ${pct}%`, pct, results)
  })

  if (zipFile) {
    onProgress?.('images', 'Import des images...', 0)
    report.images = await importImages(zipFile, registry, (pct, results) => {
      onProgress?.('images', `Import des images... ${pct}%`, pct, results)
    })
  }

  onProgress?.('salaries', 'Import des salaires...', 0)
  report.salaries = await importSalaries(salaryRows, registry, (pct, results) => {
    onProgress?.('salaries', `Import des salaires... ${pct}%`, pct, results)
  })

  return report
}
