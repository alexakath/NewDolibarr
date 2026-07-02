import { apiFetch } from '../api/dolibarr'
import { syncToSQLite, clearSQLite, clearJoursFeries, backendFetch } from '../api/backend'

export async function syncEmployees() {
  const users = await apiFetch('/users')
  const employees = users.filter((u) => u.employee === '1' && u.admin !== '1')
  await syncToSQLite('employees', employees)
  return employees.length
}

export async function syncSalaries() {
  const salaries = await apiFetch('/salaries')
  await syncToSQLite('salaries', salaries)
  return salaries.length
}

export async function syncAll() {
  const [empCount, salCount] = await Promise.all([
    syncEmployees(),
    syncSalaries(),
  ])
  return { employees: empCount, salaries: salCount }
}

export async function resetSQLite() {
  const [emp, sal, hist, jf] = await Promise.all([
    clearSQLite('employees'),
    clearSQLite('salaries'),
    clearSQLite('import_history'),
    clearJoursFeries(),
  ])
  return {
    employees: emp.deleted || 0,
    salaries: sal.deleted || 0,
    import_history: hist.deleted || 0,
    jours_feries: jf.deleted || 0,
  }
}

export async function resetImages() {
  return backendFetch('/photos', { method: 'DELETE' })
}
