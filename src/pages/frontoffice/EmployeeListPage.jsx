import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiX } from 'react-icons/fi'
import { getUsers } from '../../services/userService'

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #1e1e2e',
}

const filterInput = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: '#0f0f1a',
  border: '1px solid #2d3748',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '0.85rem',
  outline: 'none',
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

  const [filters, setFilters] = useState({
    ref: '',
    nom: '',
    genre: '',
    login: '',
  })

  useEffect(() => {
    getUsers()
      .then((users) => {
        setEmployees(users.filter((u) => u.employee === '1' && u.admin !== '1'))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (filters.ref && !String(emp.ref_employee || emp.id).includes(filters.ref)) return false
      if (filters.nom && !`${emp.lastname} ${emp.firstname}`.toLowerCase().includes(filters.nom.toLowerCase())) return false
      if (filters.genre) {
        if (filters.genre === 'man' && emp.gender !== 'man') return false
        if (filters.genre === 'woman' && emp.gender !== 'woman') return false
      }
      if (filters.login && !emp.login.toLowerCase().includes(filters.login.toLowerCase())) return false
      return true
    })
  }, [employees, filters])

  const hasFilters = Object.values(filters).some(v => v !== '')

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({ ref: '', nom: '', genre: '', login: '' })
  }

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'var(--danger)' }}>Erreur : {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Ressources humaines</p>
          <h1 style={{ margin: 0 }}>Salariés</h1>
        </div>
        <div style={{ ...card, padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          {employees.length} salarié{employees.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>
            <FiSearch size={14} />
            Recherche multi-critères
          </div>
          {hasFilters && (
            <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid #2d3748', borderRadius: '6px', color: '#94a3b8', padding: '0.3rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              <FiX size={14} />
              Effacer
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Réf</label>
            <input style={filterInput} value={filters.ref} onChange={(e) => updateFilter('ref', e.target.value)} placeholder="Ex: 1" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Nom</label>
            <input style={filterInput} value={filters.nom} onChange={(e) => updateFilter('nom', e.target.value)} placeholder="Rechercher..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Genre</label>
            <select style={filterInput} value={filters.genre} onChange={(e) => updateFilter('genre', e.target.value)}>
              <option value="">Tous</option>
              <option value="man">Homme</option>
              <option value="woman">Femme</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Login</label>
            <input style={filterInput} value={filters.login} onChange={(e) => updateFilter('login', e.target.value)} placeholder="Rechercher..." />
          </div>
        </div>
      </div>

      {/* Résultat */}
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
        {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        {hasFilters && ` (filtré${filtered.length > 1 ? 's' : ''})`}
      </div>

      {/* Tableau */}
      <div style={card}>
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Réf</th>
              <th>Nom</th>
              <th>Genre</th>
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
