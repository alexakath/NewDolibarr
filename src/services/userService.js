import { apiFetch } from '../api/dolibarr'

export function getUsers() {
  return apiFetch('/users')
}

export function getUserById(id) {
  return apiFetch(`/users/${id}`)
}

export function createUser(data) {
  return apiFetch('/users', { method: 'POST', body: data })
}

export function deleteUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' })
}
