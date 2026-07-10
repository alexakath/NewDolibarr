import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUsers } from '../../services/userService'

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #1e1e2e',
}

const badgeStyle = (color) => ({
  display: 'inline-block',
  padding: '0.15rem 0.6rem',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: '500',
  background: `${color}15`,
  color: color,
})

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState({ q: '', genre: '', poste: '' })

  useEffect(() => {
    getUsers()
      .then((users) => {
        setEmployees(users.filter((u) => u.employee === '1' && u.admin !== '1'))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'var(--danger)' }}>Erreur : {error}</p>

  const filtered = employees.filter((emp) => {
    const q = search.q.trim().toLowerCase()
    if (q) {
      const text = `${emp.lastname} ${emp.firstname} ${emp.login} ${emp.ref_employee || emp.id}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    if (search.genre && emp.gender !== search.genre) return false
    if (search.poste && !(emp.job || '').toLowerCase().includes(search.poste.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Ressources humaines</p>
          <h1 style={{ margin: 0 }}>Salariés</h1>
        </div>
        <div style={{ ...card, padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          {filtered.length} salarié{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input placeholder="Recherche (nom, login, réf)" value={search.q} onChange={(e) => setSearch({ ...search, q: e.target.value })} />
        <input placeholder="Poste" value={search.poste} onChange={(e) => setSearch({ ...search, poste: e.target.value })} />
        <select value={search.genre} onChange={(e) => setSearch({ ...search, genre: e.target.value })}>
          <option value="">Genre (tous)</option>
          <option value="man">Homme</option>
          <option value="woman">Femme</option>
        </select>
      </div>

      <div style={card}>
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Réf</th>
              <th>Nom</th>
              <th>Genre</th>
              <th>Poste</th>
              <th>Login</th>
              <th>Heures/sem.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <img
                    src={`/backend/api/photos/${emp.ref_employee || emp.id}`}
                    alt={emp.lastname}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1e1e2e' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </td>
                <td style={{ color: '#64748b' }}>{emp.ref_employee || emp.id}</td>
                <td>
                  <Link to={`/employees/${emp.id}/payments`} style={{ color: '#3b82f6', fontWeight: '500' }}>
                    {emp.lastname} {emp.firstname}
                  </Link>
                </td>
                <td>
                  <span style={badgeStyle(emp.gender === 'man' ? '#3b82f6' : '#ec4899')}>
                    {emp.gender === 'man' ? 'Homme' : emp.gender === 'woman' ? 'Femme' : '-'}
                  </span>
                </td>
                <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{emp.job || '-'}</td>
                <td><code style={{ fontSize: '0.85rem', color: '#94a3b8', background: '#0f0f1a', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{emp.login}</code></td>
                <td>{emp.weeklyhours ? parseFloat(emp.weeklyhours) + 'h' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
