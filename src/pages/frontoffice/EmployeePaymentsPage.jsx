import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCreditCard, FiUser } from 'react-icons/fi'
import { getUserById } from '../../services/userService'
import { getSalaries, getPayments } from '../../services/salaryService'

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #1e1e2e',
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

function formatAmount(val) {
  return (parseFloat(val) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
}

function extractRef(label) {
  const match = label?.match(/#(\d+)/)
  return match ? match[1] : '-'
}

function getStatus(amount, totalPaid) {
  if (totalPaid >= amount) return { ...STATUS_CONFIG.paid, value: 'paid' }
  if (totalPaid > 0) return { ...STATUS_CONFIG.started, value: 'started' }
  return { ...STATUS_CONFIG.unpaid, value: 'unpaid' }
}

export default function EmployeePaymentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      getUserById(id),
      getSalaries(),
      getPayments().catch(() => []),
    ])
      .then(([user, allSalaries, allPayments]) => {
        setEmployee(user)
        const sals = allSalaries.filter((s) => String(s.fk_user) === String(id))
        const enriched = sals.map((salary) => {
          const payments = allPayments.filter((p) => String(p.fk_salary) === String(salary.id))
          const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
          const amount = parseFloat(salary.amount) || 0
          return { ...salary, payments, totalPaid, remaining: amount - totalPaid }
        })
        setSalaries(enriched)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'var(--danger)' }}>Erreur : {error}</p>

  const totalSalary = salaries.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  const totalPaidAll = salaries.reduce((sum, s) => sum + s.totalPaid, 0)

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid #2d3748', borderRadius: '8px', color: '#94a3b8', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
        <FiArrowLeft size={16} />
        Retour
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Historique</p>
          <h1 style={{ margin: 0 }}>Paiements</h1>
        </div>
      </div>

      {/* Fiche employé */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <img
          src={`/backend/api/photos/${employee?.ref_employee || employee?.id}`}
          alt={employee?.lastname}
          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1e1e2e' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '1.1rem' }}>{employee?.lastname} {employee?.firstname}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Réf: {employee?.ref_employee || employee?.id} · Login: {employee?.login}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total salaires</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>{formatAmount(totalSalary)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total réglé</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#4ade80' }}>{formatAmount(totalPaidAll)}</div>
        </div>
      </div>

      {salaries.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', color: '#4a5568' }}>
          Aucun salaire trouvé pour cet employé.
        </div>
      ) : (
        salaries.map((salary) => {
          const amount = parseFloat(salary.amount) || 0
          const status = getStatus(amount, salary.totalPaid)

          return (
            <div key={salary.id} style={{ ...card, marginBottom: '1rem', borderLeft: `3px solid ${status.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Salaire #{extractRef(salary.label)}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {formatDate(salary.datesp)} → {formatDate(salary.dateep)}
                  </div>
                </div>
                <span style={{ display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: status.bg, color: status.color }}>
                  {status.label}
                </span>
              </div>

              {salary.payments.length > 0 ? (
                <table style={{ marginBottom: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Date paiement</th>
                      <th style={{ textAlign: 'right' }}>Montant réglé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salary.payments.map((p, i) => (
                      <tr key={i}>
                        <td>{formatDate(p.datep || p.datepaye)}</td>
                        <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatAmount(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#4a5568', fontSize: '0.85rem', marginBottom: '1rem' }}>Aucun paiement enregistré</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1rem', background: '#0f0f1a', borderRadius: '8px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
                  <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{formatAmount(amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Réglé</div>
                  <div style={{ fontWeight: '600', color: '#4ade80' }}>{formatAmount(salary.totalPaid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Reste</div>
                  <div style={{ fontWeight: '600', color: salary.remaining > 0 ? '#f87171' : '#4ade80' }}>{formatAmount(salary.remaining)}</div>
                </div>
                {status.value !== 'paid' && (
                  <button
                    onClick={() => navigate(`/salaries/create?pay=${salary.id}`)}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.85rem', background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                  >
                    <FiCreditCard size={14} />
                    Payer
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
