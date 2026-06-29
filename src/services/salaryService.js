import { apiFetch } from '../api/dolibarr'

export function getSalaries() {
  return apiFetch('/salaries')
}

export function getSalaryById(id) {
  return apiFetch(`/salaries/${id}`)
}

export function getSalariesByUser(userId) {
  return apiFetch(`/salaries?fk_user=${userId}`)
}

export function createSalary(data) {
  return apiFetch('/salaries', { method: 'POST', body: data })
}

export function deleteSalary(id) {
  return apiFetch(`/salaries/${id}`, { method: 'DELETE' })
}

export function createPayment(salaryId, data) {
  return apiFetch(`/salaries/${salaryId}/payments`, { method: 'POST', body: data })
}

export function getPayments() {
  return apiFetch('/salaries/payments')
}
