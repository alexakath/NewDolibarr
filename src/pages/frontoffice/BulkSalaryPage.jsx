import { useState, useEffect, useMemo } from 'react'
import { FiZap, FiFilter, FiCheck, FiX, FiLoader } from 'react-icons/fi'
import { getUsers } from '../../services/userService'
import { createSalary } from '../../services/salaryService'

const card = {
  background: '#12121e',
  border: '1px solid #1e1e2e',
  borderRadius: '10px',
  padding: '1.5rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: '#0f0f1a',
  border: '1px solid #2d3748',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const sectionLabel = {
  color: '#4a5568',
  fontSize: '0.7rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  marginBottom: '1rem',
}

export default function BulkSalaryPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({ poste: '', genre: '', heuresMin: '', heuresMax: '' })
  const [params, setParams] = useState({ datesp: '', dateep: '', amount: '' })
  const [showParams, setShowParams] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    getUsers()
      .then(users => setEmployees(users.filter(u => u.employee === '1' && u.admin !== '1')))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (filters.poste && !(emp.job || '').toLowerCase().includes(filters.poste.toLowerCase())) return false
      if (filters.genre === 'man' && emp.gender !== 'man') return false
      if (filters.genre === 'woman' && emp.gender !== 'woman') return false
      if (filters.heuresMin && Number(emp.weeklyhours || emp.nb_heures || 0) < Number(filters.heuresMin)) return false
      if (filters.heuresMax && Number(emp.weeklyhours || emp.nb_heures || 0) > Number(filters.heuresMax)) return false
      return true
    })
  }, [employees, filters])

  function updateFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }))
    setShowParams(false)
    setReport(null)
  }

  function updateParam(key, val) {
    setParams(prev => ({ ...prev, [key]: val }))
  }

  async function handleGenerate() {
    if (!params.datesp || !params.dateep || !params.amount) return
    setGenerating(true)
    setReport(null)

    const results = []
    for (const emp of filtered) {
      try {
        await createSalary({
          fk_user: emp.id,
          amount: parseFloat(String(params.amount).replace(',', '.')),
          datesp: params.datesp,
          dateep: params.dateep,
          label: `Salaire collectif — ${emp.lastname || emp.login}`,
        })
        results.push({ emp, success: true })
      } catch (err) {
        results.push({ emp, success: false, error: err.message })
      }
    }

    setReport(results)
    setGenerating(false)
  }

  const genderLabel = (g) => g === 'man' ? 'Homme' : g === 'woman' ? 'Femme' : '-'
  const genderColor = (g) => g === 'man' ? '#3b82f6' : g === 'woman' ? '#ec4899' : '#64748b'

  const successCount = report?.filter(r => r.success).length ?? 0
  const errorCount = report?.filter(r => !r.success).length ?? 0

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FiZap size={24} color="#3b82f6" />
        <div>
          <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>Salaires collectifs</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Générer un salaire pour plusieurs salariés simultanément</p>
        </div>
      </div>

      {/* Étape 1 — Filtres */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <p style={sectionLabel}><FiFilter size={12} style={{ marginRight: '0.4rem' }} />Étape 1 — Filtrer les salariés</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Poste</label>
            <input style={inputStyle} placeholder="Ex: Comptable" value={filters.poste} onChange={e => updateFilter('poste', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Genre</label>
            <select style={inputStyle} value={filters.genre} onChange={e => updateFilter('genre', e.target.value)}>
              <option value="">Tous</option>
              <option value="man">Homme</option>
              <option value="woman">Femme</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Heures min</label>
            <input style={inputStyle} type="number" placeholder="Ex: 30" value={filters.heuresMin} onChange={e => updateFilter('heuresMin', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Heures max</label>
            <input style={inputStyle} type="number" placeholder="Ex: 40" value={filters.heuresMax} onChange={e => updateFilter('heuresMax', e.target.value)} />
          </div>
        </div>

        {/* Liste filtrée */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {loading ? 'Chargement...' : `${filtered.length} salarié${filtered.length !== 1 ? 's' : ''} sélectionné${filtered.length !== 1 ? 's' : ''}`}
            </span>
            {filtered.length > 0 && !showParams && (
              <button
                onClick={() => setShowParams(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <FiZap size={14} />
                Générer le salaire
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Réf</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Poste</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Genre</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Heures</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => (
                  <tr key={emp.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{emp.ref_employee || emp.id}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0', fontWeight: 500 }}>{emp.lastname} {emp.firstname}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{emp.job || '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{ background: `${genderColor(emp.gender)}15`, color: genderColor(emp.gender), padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem' }}>
                        {genderLabel(emp.gender)}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{emp.weeklyhours ? parseFloat(emp.weeklyhours) + 'h' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !loading && <p style={{ color: '#4a5568', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Aucun salarié ne correspond aux filtres.</p>
          )}
        </div>
      </div>

      {/* Étape 2 — Paramètres */}
      {showParams && !report && (
        <div style={{ ...card, marginBottom: '1.5rem', borderColor: '#3b82f620' }}>
          <p style={sectionLabel}>Étape 2 — Paramètres du salaire</p>
          <div style={{ background: '#0f0f1a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Ce salaire sera créé pour <strong style={{ color: '#e2e8f0' }}>{filtered.length} salarié{filtered.length !== 1 ? 's' : ''}</strong>.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Date début</label>
              <input style={inputStyle} type="date" value={params.datesp} onChange={e => updateParam('datesp', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Date fin</label>
              <input style={inputStyle} type="date" value={params.dateep} onChange={e => updateParam('dateep', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Montant (€)</label>
              <input style={inputStyle} type="text" placeholder="Ex: 1500" value={params.amount} onChange={e => updateParam('amount', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleGenerate}
              disabled={!params.datesp || !params.dateep || !params.amount || generating}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: (!params.datesp || !params.dateep || !params.amount || generating) ? 0.5 : 1 }}
            >
              <FiZap size={15} />
              {generating ? 'Génération en cours...' : `Confirmer — ${filtered.length} salaire${filtered.length !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => setShowParams(false)}
              style={{ padding: '0.6rem 1rem', background: 'none', border: '1px solid #2d3748', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 — Rapport */}
      {report && (
        <div style={{ ...card, borderColor: errorCount === 0 ? '#16653420' : '#7f1d1d20' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ ...sectionLabel, marginBottom: 0 }}>Étape 3 — Rapport de génération</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {successCount > 0 && (
                <span style={{ background: '#16653420', color: '#86efac', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {successCount} succès
                </span>
              )}
              {errorCount > 0 && (
                <span style={{ background: '#7f1d1d20', color: '#f87171', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {errorCount} erreur{errorCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Salarié</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Réf</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, idx) => (
                <tr key={r.emp.id} style={{ borderBottom: idx < report.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0', fontWeight: 500 }}>{r.emp.lastname} {r.emp.firstname}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{r.emp.ref_employee || r.emp.id}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {r.success ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#86efac', fontSize: '0.8rem' }}>
                        <FiCheck size={13} /> Salaire créé
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', fontSize: '0.8rem' }}>
                        <FiX size={13} /> {r.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => { setReport(null); setShowParams(false); setParams({ datesp: '', dateep: '', amount: '' }) }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'none', border: '1px solid #2d3748', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Nouvelle génération
          </button>
        </div>
      )}
    </div>
  )
}
