import { useState, useEffect, useMemo } from 'react'
import { FiCalendar, FiFilter, FiCheck, FiX } from 'react-icons/fi'
import { getUsers } from '../../services/userService'
import { getSalaries, createSalary } from '../../services/salaryService'
import { getJoursFeries } from '../../api/backend'

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

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function pad(n) { return String(n).padStart(2, '0') }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function stripTime(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
function parseDate(val) {
  if (!val) return null
  const num = Number(val)
  if (!isNaN(num) && num > 86400) return stripTime(new Date(num * 1000))
  const str = String(val)
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(str)
  return isNaN(d) ? null : stripTime(d)
}
function formatDate(val) {
  const d = parseDate(val)
  return d ? d.toLocaleDateString('fr-FR') : '-'
}

export default function BulkSalaryByMonthPage() {
  const [employees, setEmployees] = useState([])
  const [allSalaries, setAllSalaries] = useState([])
  const [joursFeries, setJoursFeries] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({ poste: '', genre: '', heuresMin: '', heuresMax: '' })
  const [params, setParams] = useState({ mois: '', annee: '', salaireJour: '', majoration: '' })

  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    Promise.all([getUsers(), getSalaries(), getJoursFeries().catch(() => [])])
      .then(([users, salaries, jf]) => {
        setEmployees(users.filter(u => u.employee === '1' && u.admin !== '1'))
        setAllSalaries(salaries)
        setJoursFeries(jf)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (filters.poste && !(emp.job || '').toLowerCase().includes(filters.poste.toLowerCase())) return false
      if (filters.genre === 'man' && emp.gender !== 'man') return false
      if (filters.genre === 'woman' && emp.gender !== 'woman') return false
      if (filters.heuresMin && Number(emp.weeklyhours || 0) < Number(filters.heuresMin)) return false
      if (filters.heuresMax && Number(emp.weeklyhours || 0) > Number(filters.heuresMax)) return false
      return true
    })
  }, [employees, filters])

  const plan = useMemo(() => {
    if (!params.mois || !params.annee) return []
    const mois = Number(params.mois)
    const annee = Number(params.annee)
    const monthStart = new Date(annee, mois - 1, 1)
    const monthEnd = new Date(annee, mois, 0)
    const holidaySet = new Set(joursFeries.map(j => j.date?.slice(0, 10)))
    const salaireJour = parseFloat(String(params.salaireJour).replace(',', '.')) || 0
    const majoration = parseFloat(String(params.majoration).replace(',', '.')) || 0

    return filtered.map((emp) => {
      const empSalaries = allSalaries.filter(s => Number(s.fk_user) === Number(emp.id))

      // Marque chaque jour du mois déjà couvert par un salaire existant (les périodes
      // peuvent se chevaucher ou laisser des trous, donc on ne peut pas se contenter
      // de la dernière date de fin trouvée).
      const covered = new Set()
      for (const s of empSalaries) {
        const sStart = parseDate(s.datesp)
        const sEnd = parseDate(s.dateep)
        if (!sStart || !sEnd) continue
        if (sStart > monthEnd || sEnd < monthStart) continue
        const from = sStart < monthStart ? monthStart : sStart
        const to = sEnd > monthEnd ? monthEnd : sEnd
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          covered.add(toISO(d))
        }
      }

      let start = null, end = null
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        if (!covered.has(toISO(d))) {
          if (!start) start = new Date(d)
          end = new Date(d)
        }
      }

      if (!start) return { emp, done: true }

      let normalDays = 0, holidayDays = 0
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = toISO(d)
        if (covered.has(iso)) continue
        if (holidaySet.has(iso)) holidayDays++
        else normalDays++
      }
      const amount = normalDays * salaireJour + holidayDays * salaireJour * (1 + majoration / 100)

      return { emp, done: false, datesp: toISO(start), dateep: toISO(end), normalDays, holidayDays, amount }
    })
  }, [filtered, allSalaries, joursFeries, params])

  const toGenerate = plan.filter(p => !p.done)

  function updateFilter(key, val) { setFilters(prev => ({ ...prev, [key]: val })); setReport(null) }
  function updateParam(key, val) { setParams(prev => ({ ...prev, [key]: val })); setReport(null) }

  async function handleGenerate() {
    setGenerating(true)
    setReport(null)
    const results = []
    const moisLabel = `${MONTHS[Number(params.mois) - 1]} ${params.annee}`
    for (const p of toGenerate) {
      try {
        await createSalary({
          fk_user: p.emp.id,
          amount: p.amount,
          datesp: p.datesp,
          dateep: p.dateep,
          label: `Salaire ${moisLabel} — ${p.emp.lastname || p.emp.login}`,
        })
        results.push({ emp: p.emp, success: true })
      } catch (err) {
        results.push({ emp: p.emp, success: false, error: err.message })
      }
    }
    setReport(results)
    setGenerating(false)
  }

  const genderLabel = (g) => g === 'man' ? 'Homme' : g === 'woman' ? 'Femme' : '-'
  const genderColor = (g) => g === 'man' ? '#3b82f6' : g === 'woman' ? '#ec4899' : '#64748b'

  const successCount = report?.filter(r => r.success).length ?? 0
  const errorCount = report?.filter(r => !r.success).length ?? 0

  if (loading) return <p>Chargement...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FiCalendar size={24} color="#3b82f6" />
        <div>
          <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>Salaires collectifs par mois</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Générer le salaire du mois manquant pour plusieurs salariés simultanément</p>
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
      {!report && (
        <div style={{ ...card, marginBottom: '1.5rem', borderColor: '#3b82f620' }}>
          <p style={sectionLabel}>Étape 2 — Paramètres du salaire</p>
          <div style={{ background: '#0f0f1a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Ce salaire sera créé pour <strong style={{ color: '#e2e8f0' }}>{filtered.length} salarié{filtered.length !== 1 ? 's' : ''}</strong>, sur l'intervalle du mois qui n'a pas encore de salaire.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Mois</label>
              <select style={inputStyle} value={params.mois} onChange={e => updateParam('mois', e.target.value)}>
                <option value="">--</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Année</label>
              <input style={inputStyle} type="number" placeholder="Ex: 2026" value={params.annee} onChange={e => updateParam('annee', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Salaire par jour (€)</label>
              <input style={inputStyle} type="text" placeholder="Ex: 20" value={params.salaireJour} onChange={e => updateParam('salaireJour', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Majoration jour férié (%)</label>
              <input style={inputStyle} type="text" placeholder="Ex: 10" value={params.majoration} onChange={e => updateParam('majoration', e.target.value)} />
            </div>
          </div>

          {params.mois && params.annee && (
            <>
              <p style={{ ...sectionLabel, marginBottom: '0.75rem' }}>Aperçu ({toGenerate.length} salaire{toGenerate.length !== 1 ? 's' : ''} à générer)</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Salarié</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Intervalle</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Jours normaux</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Jours fériés</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((p, idx) => (
                    <tr key={p.emp.id} style={{ borderBottom: idx < plan.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0', fontWeight: 500 }}>{p.emp.lastname} {p.emp.firstname}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{p.done ? 'Déjà complet' : `${formatDate(p.datesp)} → ${formatDate(p.dateep)}`}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{p.done ? '-' : p.normalDays}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{p.done ? '-' : p.holidayDays}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0', fontWeight: 600 }}>{p.done ? '-' : p.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={toGenerate.length === 0 || !params.salaireJour || generating}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: (toGenerate.length === 0 || !params.salaireJour || generating) ? 0.5 : 1 }}
          >
            <FiCalendar size={15} />
            {generating ? 'Génération en cours...' : `Générer ${toGenerate.length} salaire${toGenerate.length !== 1 ? 's' : ''}`}
          </button>
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
            onClick={() => { setReport(null); setParams({ mois: '', annee: '', salaireJour: '', majoration: '' }) }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'none', border: '1px solid #2d3748', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Nouvelle génération
          </button>
        </div>
      )}
    </div>
  )
}
