import { useState, useEffect, useMemo } from 'react'
import { FiCreditCard, FiCheck, FiX } from 'react-icons/fi'
import { getUsers } from '../../services/userService'
import { getSalaries, getPayments, createPayment } from '../../services/salaryService'

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

export default function BulkPaymentByMonthPage() {
  const [employees, setEmployees] = useState([])
  const [allSalaries, setAllSalaries] = useState([])
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const [params, setParams] = useState({ mois: '', annee: '', posteProprioritaire: '', montant: '' })

  const [paying, setPaying] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    Promise.all([getUsers(), getSalaries(), getPayments().catch(() => [])])
      .then(([users, salaries, payments]) => {
        setEmployees(users.filter(u => u.employee === '1' && u.admin !== '1'))
        setAllSalaries(salaries)
        setAllPayments(payments)
      })
      .finally(() => setLoading(false))
  }, [])

  const eligible = useMemo(() => {
    if (!params.mois || !params.annee) return []
    const mois = Number(params.mois)
    const annee = Number(params.annee)
    const montant = parseFloat(String(params.montant).replace(',', '.')) || 0

    const paidBySalary = {}
    for (const p of allPayments) {
      const sid = String(p.fk_salary)
      paidBySalary[sid] = (paidBySalary[sid] || 0) + (parseFloat(p.amount) || 0)
    }

    const candidates = allSalaries
      .map(s => {
        const datesp = parseDate(s.datesp)
        const totalPaid = paidBySalary[String(s.id)] || 0
        const due = (parseFloat(s.amount) || 0) - totalPaid
        return { salary: s, emp: employees.find(e => Number(e.id) === Number(s.fk_user)), datesp, due }
      })
      .filter(c => c.emp && c.datesp && c.datesp.getFullYear() === annee && c.datesp.getMonth() + 1 === mois && c.due > 0)

    candidates.sort((a, b) => {
      const aPriority = params.posteProprioritaire && a.emp?.job === params.posteProprioritaire ? 0 : 1
      const bPriority = params.posteProprioritaire && b.emp?.job === params.posteProprioritaire ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      return a.datesp - b.datesp
    })

    let remaining = montant
    return candidates.map((c) => {
      if (remaining <= 0) return { ...c, montantPaye: 0, sera_paye: false, partial: false }
      if (remaining >= c.due) {
        remaining -= c.due
        return { ...c, montantPaye: c.due, sera_paye: true, partial: false }
      }
      const montantPaye = remaining
      remaining = 0
      return { ...c, montantPaye, sera_paye: true, partial: true }
    })
  }, [employees, allSalaries, allPayments, params])


//   let remaining = montant
//     return candidates.map((c) => {
//       if (remaining <= 0) return { ...c, montantPaye: 0, sera_paye: false, partial: false }
//       if (remaining >= c.due) {
//         remaining -= c.due
//         return { ...c, montantPaye: c.due, sera_paye: true, partial: false }
//       }
//       const montantPaye = remaining
//       remaining = 0
//       return { ...c, montantPaye, sera_paye: true, partial: true }
//     })
//   }, [employees, allSalaries, allPayments, params])


  const toPay = eligible.filter(c => c.sera_paye)

  function updateParam(key, val) { setParams(prev => ({ ...prev, [key]: val })); setReport(null) }

  async function handlePay() {
    setPaying(true)
    setReport(null)
    const results = []
    for (const c of eligible) {
      if (!c.sera_paye) {
        results.push({ ...c, success: false, skipped: true })
        continue
      }
      try {
        await createPayment(c.salary.id, {
          datepaye: new Date().toISOString().slice(0, 10),
          paiementtype: 4,
          chid: 0,
          amounts: { [c.salary.id]: c.montantPaye },
        })
        results.push({ ...c, success: true })
      } catch (err) {
        results.push({ ...c, success: false, error: err.message })
      }
    }
    setReport(results)
    setPaying(false)
  }

  const successCount = report?.filter(r => r.success).length ?? 0
  const skippedCount = report?.filter(r => !r.success && r.skipped).length ?? 0
  const errorCount = report?.filter(r => !r.success && !r.skipped).length ?? 0

  if (loading) return <p>Chargement...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FiCreditCard size={24} color="#3b82f6" />
        <div>
          <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>Paiement collectif par mois</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Distribuer un montant entre plusieurs salariés selon un ordre de priorité</p>
        </div>
      </div>

      {/* Étape 1 — Paramètres */}
      {!report && (
        <div style={{ ...card, marginBottom: '1.5rem', borderColor: '#3b82f620' }}>
          <p style={sectionLabel}>Étape 1 — Paramètres du paiement</p>
          <div style={{ background: '#0f0f1a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Le montant sera distribué entre les salariés ayant un salaire dû sur le mois sélectionné, poste prioritaire puis date la plus ancienne en premier.
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
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Poste prioritaire</label>
              <select style={inputStyle} value={params.posteProprioritaire} onChange={e => updateParam('posteProprioritaire', e.target.value)}>
                <option value="">Aucun</option>
                {[...new Set(employees.map(e => e.job).filter(Boolean))].map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>Montant à payer (€)</label>
              <input style={inputStyle} type="text" placeholder="Ex: 1000" value={params.montant} onChange={e => updateParam('montant', e.target.value)} />
            </div>
          </div>

          {params.mois && params.annee && (
            <>
              <p style={{ ...sectionLabel, marginBottom: '0.75rem' }}>Aperçu ({eligible.length} salarié{eligible.length !== 1 ? 's' : ''} concerné{eligible.length !== 1 ? 's' : ''}, {toPay.length} payé{toPay.length !== 1 ? 's' : ''})</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Salarié</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date début</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Montant salaire</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reste dû</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Sera payé</th>
                  </tr>
                </thead>
                <tbody>
                  {eligible.map((c, idx) => (
                    <tr key={c.salary.id} style={{ borderBottom: idx < eligible.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0', fontWeight: 500 }}>{c.emp?.lastname} {c.emp?.firstname}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{formatDate(c.salary.datesp)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{parseFloat(c.salary.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{c.due.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: c.sera_paye ? '#4ade80' : '#f87171' }}>{c.sera_paye ? `${c.montantPaye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}${c.partial ? ' (partiel)' : ''}` : 'Non (budget insuffisant)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <button
            onClick={handlePay}
            disabled={toPay.length === 0 || !params.montant || paying}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: (toPay.length === 0 || !params.montant || paying) ? 0.5 : 1 }}
          >
            <FiCreditCard size={15} />
            {paying ? 'Paiement en cours...' : `Payer ${toPay.length} salarié${toPay.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Étape 2 — Rapport */}
      {report && (
        <div style={{ ...card, borderColor: errorCount === 0 ? '#16653420' : '#7f1d1d20' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ ...sectionLabel, marginBottom: 0 }}>Étape 2 — Historique du paiement</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {successCount > 0 && (
                <span style={{ background: '#16653420', color: '#86efac', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {successCount} payé{successCount !== 1 ? 's' : ''}
                </span>
              )}
              {skippedCount > 0 && (
                <span style={{ background: '#78350f20', color: '#fbbf24', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {skippedCount} non payé{skippedCount !== 1 ? 's' : ''} (budget)
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
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Montant salaire</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Montant payé</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#4a5568', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, idx) => (
                <tr key={r.salary.id} style={{ borderBottom: idx < report.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0', fontWeight: 500 }}>{r.emp?.lastname} {r.emp?.firstname}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{parseFloat(r.salary.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{r.montantPaye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {r.success ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#86efac', fontSize: '0.8rem' }}>
                        <FiCheck size={13} /> {r.partial ? 'Payé (partiel)' : 'Payé'}
                      </span>
                    ) : r.skipped ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontSize: '0.8rem' }}>
                        <FiX size={13} /> Budget insuffisant
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
            onClick={() => { setReport(null); setParams({ mois: '', annee: '', posteProprioritaire: '', montant: '' }) }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'none', border: '1px solid #2d3748', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Nouveau paiement
          </button>
        </div>
      )}
    </div>
  )
}
