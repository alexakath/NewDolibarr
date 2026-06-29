import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiX, FiCreditCard } from 'react-icons/fi'
import { getSalariesWithDetails } from '../../composites/salaryWithDetails'

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

const STATUS_CONFIG = {
  paid: { label: 'Payé', color: '#4ade80', bg: '#4ade8015' },
  started: { label: 'Règlement commencé', color: '#fbbf24', bg: '#fbbf2415' },
  unpaid: { label: 'Impayé', color: '#f87171', bg: '#f8717115' },
}

function formatDate(val) {
  if (!val) return '-'
  const num = Number(val)
  if (!isNaN(num) && num > 86400) return new Date(num * 1000).toLocaleDateString('fr-FR')
  const d = new Date(val)
  if (isNaN(d)) return String(val)
  return d.toLocaleDateString('fr-FR')
}

function extractRef(label) {
  const match = label?.match(/#(\d+)/)
  return match ? match[1] : '-'
}

function getStatus(salary) {
  const amount = parseFloat(salary.amount) || 0
  const totalPaid = salary.totalPaid || 0
  if (salary.paye === '1' || totalPaid >= amount) return { ...STATUS_CONFIG.paid, value: 'paid' }
  if (totalPaid > 0) return { ...STATUS_CONFIG.started, value: 'started' }
  return { ...STATUS_CONFIG.unpaid, value: 'unpaid' }
}

export default function SalaryPage() {
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    ref: '', employee: '', status: '', amountMin: '', amountMax: '', dateFrom: '', dateTo: '',
  })

  useEffect(() => {
    getSalariesWithDetails()
      .then(setSalaries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return salaries.filter((s) => {
      if (filters.ref && !extractRef(s.label).includes(filters.ref)) return false
      if (filters.employee && !s.employeeName.toLowerCase().includes(filters.employee.toLowerCase())) return false
      if (filters.status && getStatus(s).value !== filters.status) return false
      const amount = parseFloat(s.amount) || 0
      if (filters.amountMin && amount < parseFloat(filters.amountMin)) return false
      if (filters.amountMax && amount > parseFloat(filters.amountMax)) return false
      if (filters.dateFrom && s.datesp && s.datesp < filters.dateFrom) return false
      if (filters.dateTo && s.dateep && s.dateep > filters.dateTo) return false
      return true
    })
  }, [salaries, filters])

  const hasFilters = Object.values(filters).some(v => v !== '')

  function updateFilter(key, value) { setFilters((prev) => ({ ...prev, [key]: value })) }
  function resetFilters() { setFilters({ ref: '', employee: '', status: '', amountMin: '', amountMax: '', dateFrom: '', dateTo: '' }) }

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'var(--danger)' }}>Erreur : {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Gestion</p>
          <h1 style={{ margin: 0 }}>Salaires</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = salaries.filter(s => getStatus(s).value === key).length
            return (
              <div key={key} style={{ ...card, padding: '0.5rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: cfg.color }}>{count}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{cfg.label}</div>
              </div>
            )
          })}
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
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Employé</label>
            <input style={filterInput} value={filters.employee} onChange={(e) => updateFilter('employee', e.target.value)} placeholder="Rechercher..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Statut</label>
            <select style={filterInput} value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">Tous</option>
              <option value="paid">Payé</option>
              <option value="started">Règlement commencé</option>
              <option value="unpaid">Impayé</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Montant min</label>
            <input style={filterInput} type="number" value={filters.amountMin} onChange={(e) => updateFilter('amountMin', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Montant max</label>
            <input style={filterInput} type="number" value={filters.amountMax} onChange={(e) => updateFilter('amountMax', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Date début</label>
            <input style={filterInput} type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Date fin</label>
            <input style={filterInput} type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
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
              <th>Réf</th>
              <th>Employé</th>
              <th>Montant</th>
              <th>Période</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const status = getStatus(s)
              return (
                <tr key={s.id}>
                  <td style={{ color: '#64748b' }}>#{extractRef(s.label)}</td>
                  <td style={{ fontWeight: '500', color: '#f1f5f9' }}>{s.employeeName}</td>
                  <td style={{ fontWeight: '600' }}>{parseFloat(s.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{formatDate(s.datesp)} → {formatDate(s.dateep)}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    {status.value !== 'paid' && (
                      <button
                        onClick={() => navigate(`/salaries/create?pay=${s.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                      >
                        <FiCreditCard size={14} />
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
