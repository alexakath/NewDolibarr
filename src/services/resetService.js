import { apiFetch } from '../api/dolibarr'
import { getJoursFeries } from '../api/backend'
import { resetSQLite, resetImages } from './syncService'

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

// ─── Suppression salaires (via API Dolibarr) ──────────────────────────────────

async function deleteSalaries(onProgress) {
  const results = { success: 0, errors: [] }

  let salaries, allPayments
  try {
    [salaries, allPayments] = await Promise.all([
      apiFetch('/salaries'),
      apiFetch('/salaries/payments').catch(() => []),
    ])
  } catch {
    return results
  }

  const paymentsBySalary = {}
  for (const p of allPayments) {
    const sid = String(p.fk_salary)
    if (!paymentsBySalary[sid]) paymentsBySalary[sid] = []
    paymentsBySalary[sid].push(p)
  }

  for (let i = 0; i < salaries.length; i++) {
    const salary = salaries[i]
    const payments = paymentsBySalary[String(salary.id)] || []

    for (const payment of payments) {
      try {
        await apiFetch(`/salaries/${payment.id}/payments`, { method: 'DELETE' })
      } catch (err) {
        if (!err.message.includes('404')) {
          results.errors.push({ id: `paiement#${payment.id}`, message: err.message })
        }
      }
    }

    try {
      await apiFetch(`/salaries/${salary.id}`, { method: 'DELETE' })
      results.success++
    } catch (err) {
      if (err.message.includes('404')) {
        results.success++
      } else {
        results.errors.push({ id: salary.id, message: err.message })
      }
    }

    onProgress?.(Math.round(((i + 1) / salaries.length) * 100), results)
  }

  return results
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
  report.salaries = await deleteSalaries((pct, results) => {
    onProgress?.('salaries', `Suppression des salaires... ${pct}%`, pct, results)
  })
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
