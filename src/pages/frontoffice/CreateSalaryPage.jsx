import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiPlusCircle, FiCreditCard, FiCheckCircle } from 'react-icons/fi'
import { getUsers } from '../../services/userService'
import { createSalary, createPayment, getSalaries, getPayments } from '../../services/salaryService'

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #1e1e2e',
}

const formInput = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: '#0f0f1a',
  border: '1px solid #2d3748',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '0.9rem',
  outline: 'none',
}

const STATUS_CONFIG = {
  paid: { label: 'Payé', color: '#4ade80', bg: '#4ade8015' },
  started: { label: 'Règlement commencé', color: '#fbbf24', bg: '#fbbf2415' },
  unpaid: { label: 'Impayé', color: '#f87171', bg: '#f8717115' },
}

function formatAmount(val) {
  return (parseFloat(val) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
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
  return match ? match[1] : null
}

export default function CreateSalaryPage() {
  const [searchParams] = useSearchParams()
  const payId = searchParams.get('pay')
  const [activeTab, setActiveTab] = useState(payId ? 'pay' : 'create')

  const tabBase = {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.65rem 1.25rem', cursor: 'pointer',
    border: '1px solid #2d3748', fontSize: '0.9rem', fontWeight: '500',
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Opérations</p>
      <h1 style={{ margin: '0 0 1.5rem' }}>Gestion des salaires</h1>

      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            ...tabBase,
            background: activeTab === 'create' ? '#3b82f6' : 'transparent',
            color: activeTab === 'create' ? 'white' : '#94a3b8',
            borderRadius: '8px 0 0 8px',
            borderColor: activeTab === 'create' ? '#3b82f6' : '#2d3748',
          }}
        >
          <FiPlusCircle size={16} />
          Créer un salaire
        </button>
        <button
          onClick={() => setActiveTab('pay')}
          style={{
            ...tabBase,
            background: activeTab === 'pay' ? '#3b82f6' : 'transparent',
            color: activeTab === 'pay' ? 'white' : '#94a3b8',
            borderRadius: '0 8px 8px 0',
            borderColor: activeTab === 'pay' ? '#3b82f6' : '#2d3748',
          }}
        >
          <FiCreditCard size={16} />
          Payer un salaire
        </button>
      </div>

      {activeTab === 'create' ? <CreateTab /> : <PayTab preSelectedId={payId} />}
    </div>
  )
}

function CreateTab() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ fk_user: '', amount: '', datesp: '', dateep: '', label: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers()
      .then((users) => setEmployees(users.filter((u) => u.employee === '1' && u.admin !== '1')))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.fk_user || !form.amount || !form.datesp || !form.dateep) {
      setError('Tous les champs sont obligatoires.')
      return
    }

    try {
      await createSalary({
        fk_user: Number(form.fk_user),
        amount: parseFloat(form.amount.replace(',', '.')),
        datesp: form.datesp,
        dateep: form.dateep,
        label: form.label || 'Salaire',
      })
      setMessage('Salaire créé avec succès.')
      setForm({ fk_user: '', amount: '', datesp: '', dateep: '', label: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Chargement...</p>

  return (
    <div style={card}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem' }}>Employé</label>
          <select style={formInput} value={form.fk_user} onChange={(e) => setForm({ ...form, fk_user: e.target.value })}>
            <option value="">-- Sélectionner --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.lastname} {emp.firstname}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem' }}>Montant</label>
          <input style={formInput} type="text" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Ex: 890" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Date début</label>
            <input style={formInput} type="date" value={form.datesp} onChange={(e) => setForm({ ...form, datesp: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Date fin</label>
            <input style={formInput} type="date" value={form.dateep} onChange={(e) => setForm({ ...form, dateep: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem' }}>Libellé (optionnel)</label>
          <input style={formInput} type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: Salaire mars 2026" />
        </div>
        <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
          <FiPlusCircle size={18} />
          Créer le salaire
        </button>
        {message && <p style={{ color: '#4ade80', fontWeight: '500' }}><FiCheckCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} size={16} />{message}</p>}
        {error && <p style={{ color: '#f87171', fontWeight: '500' }}>{error}</p>}
      </form>
    </div>
  )
}

function PayTab({ preSelectedId }) {
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(preSelectedId || '')
  const [payments, setPayments] = useState([])
  const [paymentForm, setPaymentForm] = useState({ amount: '', datepaye: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getSalaries(), getUsers(), getPayments().catch(() => [])])
      .then(([sals, users, allPayments]) => {
        const userMap = {}
        for (const u of users) userMap[u.id] = u

        const paymentsBySalary = {}
        for (const p of allPayments) {
          const sid = String(p.fk_salary)
          if (!paymentsBySalary[sid]) paymentsBySalary[sid] = []
          paymentsBySalary[sid].push(p)
        }

        setSalaries(sals.map((s) => {
          const existing = paymentsBySalary[String(s.id)] || []
          const existingTotal = existing.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
          return { ...s, employeeName: userMap[s.fk_user]?.lastname || '-', existingPayments: existing, existingTotal }
        }))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const selected = salaries.find((s) => String(s.id) === selectedId)
  const amount = selected ? parseFloat(selected.amount) || 0 : 0
  const existingTotal = selected?.existingTotal || 0
  const newTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = existingTotal + newTotal
  const remaining = amount - totalPaid

  const statusKey = remaining <= 0 ? 'paid' : totalPaid > 0 ? 'started' : 'unpaid'
  const status = STATUS_CONFIG[statusKey]

  function handleSelectSalary(id) {
    setSelectedId(id)
    setPayments([])
    setPaymentForm({ amount: '', datepaye: '' })
    setMessage('')
    setError('')
  }

  async function handleAddPayment(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!paymentForm.amount || !paymentForm.datepaye) {
      setError('Montant et date obligatoires.')
      return
    }

    const payAmount = parseFloat(paymentForm.amount.replace(',', '.'))

    try {
      await createPayment(selectedId, {
        datepaye: paymentForm.datepaye,
        paiementtype: 4,
        chid: 0,
        amounts: { [selectedId]: payAmount },
      })
      setPayments((prev) => [...prev, { amount: payAmount, datepaye: paymentForm.datepaye }])
      setPaymentForm({ amount: '', datepaye: '' })
      setMessage('Paiement ajouté.')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Chargement...</p>

  return (
    <div style={card}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem' }}>Sélectionner un salaire</label>
        <select style={formInput} value={selectedId} onChange={(e) => handleSelectSalary(e.target.value)}>
          <option value="">-- Sélectionner --</option>
          {salaries.filter((s) => s.paye !== '1').map((s) => (
            <option key={s.id} value={s.id}>
              {extractRef(s.label) ? `Réf #${extractRef(s.label)}` : s.label} — {s.employeeName} — {formatAmount(s.amount)}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>{selected.label} — {selected.employeeName}</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                {formatDate(selected.datesp)} → {formatDate(selected.dateep)}
              </div>
            </div>
            <span style={{ padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>

          {(selected.existingPayments.length > 0 || payments.length > 0) && (
            <table style={{ marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Date paiement</th>
                  <th style={{ textAlign: 'right' }}>Montant réglé</th>
                </tr>
              </thead>
              <tbody>
                {selected.existingPayments.map((p, i) => (
                  <tr key={`existing-${i}`}>
                    <td>{formatDate(p.datep || p.datepaye)}</td>
                    <td style={{ textAlign: 'right' }}>{formatAmount(p.amount)}</td>
                  </tr>
                ))}
                {payments.map((p, i) => (
                  <tr key={`new-${i}`}>
                    <td>{formatDate(p.datepaye)}</td>
                    <td style={{ textAlign: 'right', color: '#4ade80' }}>{formatAmount(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1rem', background: '#0f0f1a', borderRadius: '8px', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
              <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{formatAmount(amount)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Réglé</div>
              <div style={{ fontWeight: '600', color: '#4ade80' }}>{formatAmount(totalPaid)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Reste</div>
              <div style={{ fontWeight: '600', color: remaining > 0 ? '#f87171' : '#4ade80' }}>{formatAmount(remaining)}</div>
            </div>
          </div>

          {remaining > 0 && (
            <form onSubmit={handleAddPayment} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Montant</label>
                <input style={formInput} type="text" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={`Max: ${formatAmount(remaining)}`} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.3rem' }}>Date</label>
                <input style={formInput} type="date" value={paymentForm.datepaye} onChange={(e) => setPaymentForm({ ...paymentForm, datepaye: e.target.value })} />
              </div>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.6rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <FiCreditCard size={16} />
                Ajouter
              </button>
            </form>
          )}

          {message && <p style={{ marginTop: '1rem', color: '#4ade80', fontWeight: '500' }}><FiCheckCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} size={16} />{message}</p>}
          {error && <p style={{ marginTop: '1rem', color: '#f87171', fontWeight: '500' }}>{error}</p>}
        </div>
      )}
    </div>
  )
}
