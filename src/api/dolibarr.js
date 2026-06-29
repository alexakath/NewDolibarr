const DOLAPIKEY = import.meta.env.VITE_DOLAPIKEY;

export async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', body } = options;

  const config = {
    method,
    headers: {
      'DOLAPIKEY': DOLAPIKEY,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`/api${endpoint}`, config);

  if (!response.ok) {
    let detail = response.statusText
    try {
      const errBody = await response.json()
      detail = errBody?.error?.message || errBody?.error || JSON.stringify(errBody)
    } catch {}
    throw new Error(`Erreur API ${response.status}: ${detail}`)
  }

  if (response.status === 204) return null;

  return response.json();
}
