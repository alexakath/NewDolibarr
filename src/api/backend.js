export async function backendFetch(endpoint, options = {}) {
  const { method = 'GET', body } = options

  const config = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`/backend/api${endpoint}`, config)

  if (!response.ok) {
    let detail = response.statusText
    try {
      const errBody = await response.json()
      detail = errBody?.error || JSON.stringify(errBody)
    } catch {}
    throw new Error(`Backend ${response.status}: ${detail}`)
  }

  return response.json()
}

export function syncToSQLite(moduleKey, data) {
  return backendFetch(`/sync/${moduleKey}`, { method: 'POST', body: data })
}

export function getFromSQLite(moduleKey) {
  return backendFetch(`/${moduleKey}`)
}

export function clearSQLite(moduleKey) {
  return backendFetch(`/${moduleKey}`, { method: 'DELETE' })
}

export function getSetting(key) {
  return backendFetch(`/settings/${key}`)
}

export function setSetting(key, value) {
  return backendFetch(`/settings/${key}`, { method: 'PUT', body: { value } })
}

export function checkAuthCode(code) {
  return backendFetch('/auth', { method: 'POST', body: { code } })
}

export function logImport(type, count, errors) {
  return backendFetch('/import_history', { method: 'POST', body: { type, count, errors } })
}
