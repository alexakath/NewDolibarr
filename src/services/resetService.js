import { apiFetch } from '../api/dolibarr'
import { getJoursFeries } from '../api/backend'
import { resetSQLite, resetImages } from './syncService'

const DOLAPIKEY = import.meta.env.VITE_DOLAPIKEY

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getResetStats() {
  const stats = {}

  try {
    const salaries = await apiFetch('/salaries')
    stats.salaries = { label: 'Salaires', count: salaries.length }
  } catch {
    stats.salaries = { label: 'Salaires', count: 0 }
  }

  try {
    const users = await apiFetch('/users')
    const employees = users.filter((u) => u.admin !== '1' && u.login !== 'admin')
    stats.employees = { label: 'Employés', count: employees.length }
  } catch {
    stats.employees = { label: 'Employés', count: 0 }
  }

  try {
    const jf = await getJoursFeries()
    stats.jours_feries = { label: 'Jours fériés', count: jf.length }
  } catch {
    stats.jours_feries = { label: 'Jours fériés', count: 0 }
  }

  return stats
}

// ─── Suppression salaires (via script PHP custom) ─────────────────────────────

async function deleteSalaries() {
  const response = await fetch('/custom-api?action=reset_salaries', {
    method: 'POST',
    headers: { 'DOLAPIKEY': DOLAPIKEY },
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Erreur ${response.status}`)
  }

  return response.json()
}

// ─── Suppression employés (via API Dolibarr) ──────────────────────────────────

async function deleteEmployees(onProgress) {
  const results = { success: 0, errors: [] }

  let users
  try {
    users = await apiFetch('/users')
    users = users.filter((u) => u.admin !== '1' && u.login !== 'admin')
  } catch {
    return results
  }

  for (let i = 0; i < users.length; i++) {
    try {
      await apiFetch(`/users/${users[i].id}`, { method: 'DELETE' })
      results.success++
    } catch (err) {
      if (err.message.includes('404')) {
        results.success++
      } else {
        results.errors.push({ id: users[i].id, message: err.message })
      }
    }
    onProgress?.(Math.round(((i + 1) / users.length) * 100), results)
  }

  return results
}

// ─── Orchestrateur ────────────────────────────────────────────────────────────

export async function runReset(onProgress) {
  const report = {}

  onProgress?.('salaries', 'Suppression des salaires...', 0)
  let salaryCount = 0
  try {
    const salaries = await apiFetch('/salaries')
    salaryCount = salaries.length
  } catch {}
  try {
    await deleteSalaries()
    report.salaries = { success: salaryCount, errors: [] }
  } catch (err) {
    report.salaries = { success: 0, errors: [{ id: '-', message: err.message }] }
  }
  onProgress?.('salaries', 'Salaires supprimés', 100)

  onProgress?.('employees', 'Suppression des employés...', 0)
  report.employees = await deleteEmployees((pct, results) => {
    onProgress?.('employees', `Suppression des employés... ${pct}%`, pct, results)
  })

  onProgress?.('images', 'Suppression des images...', 0)
  try {
    const imgResult = await resetImages()
    report.images = { success: imgResult.deleted || 0, errors: [] }
  } catch (err) {
    report.images = { success: 0, errors: [{ id: '-', message: err.message }] }
  }
  onProgress?.('images', 'Images supprimées', 100)

  onProgress?.('sqlite', 'Nettoyage SQLite...', 0)
  try {
    const sqliteResult = await resetSQLite()
    const total = sqliteResult.employees + sqliteResult.salaries + sqliteResult.import_history
    report.sqlite = { success: total, errors: [] }
    report.jours_feries = { success: sqliteResult.jours_feries || 0, errors: [] }
  } catch (err) {
    report.sqlite = { success: 0, errors: [{ id: '-', message: err.message }] }
    report.jours_feries = { success: 0, errors: [{ id: '-', message: err.message }] }
  }
  onProgress?.('sqlite', 'SQLite nettoyé', 100)

  return report
}
