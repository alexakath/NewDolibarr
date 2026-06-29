import { useState, useEffect, useMemo } from 'react'
import { FiUsers, FiDollarSign, FiTrendingUp, FiCalendar } from 'react-icons/fi'
import { getSalaries, getPayments } from '../../services/salaryService'
import { getUsers } from '../../services/userService'

function formatAmount(val) {
  return (parseFloat(val) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
}

function parseDateVal(val) {
  if (!val) return null
  const num = Number(val)
  if (!isNaN(num) && num > 86400) return new Date(num * 1000)
  const d = new Date(val)
  return isNaN(d) ? null : d
}

function formatDateDisplay(d) {
  if (!d) return '-'
  return d.toLocaleDateString('fr-FR')
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #1e1e2e',
}

const statCard = {
  ...card,
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
}

const iconBox = (color) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: `${color}15`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color,
  flexShrink: 0,
})

const filterSelect = {
  background: '#1a1a2e',
  border: '1px solid #2d3748',
  color: '#e2e8f0',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.85rem',
  outline: 'none',
}

export default function DashboardPage() {
  const [genderData, setGenderData] = useState(null)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [totalSalaries, setTotalSalaries] = useState(0)
  const [paymentRows, setPaymentRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    Promise.all([
      getSalaries(),
      getUsers(),
      getPayments().catch(() => []),
    ])
      .then(([salaries, users, payments]) => {
        const userMap = {}
        for (const u of users) userMap[u.id] = u

        const salaryMap = {}
        for (const s of salaries) salaryMap[s.id] = s

        const employees = users.filter(u => u.employee === '1' && u.admin !== '1')
        setTotalEmployees(employees.length)
        setTotalSalaries(salaries.length)

        const paymentsBySalary = {}
        for (const p of payments) {
          const sid = String(p.fk_salary)
          if (!paymentsBySalary[sid]) paymentsBySalary[sid] = []
          paymentsBySalary[sid].push(p)
        }

        const gender = {
          homme: { regle: 0, nonRegle: 0, total: 0 },
          femme: { regle: 0, nonRegle: 0, total: 0 },
          tous: { regle: 0, nonRegle: 0, total: 0 },
        }

        for (const salary of salaries) {
          const user = userMap[salary.fk_user]
          if (!user || user.admin === '1') continue

          const amount = parseFloat(salary.amount) || 0
          const salaryPayments = paymentsBySalary[String(salary.id)] || []
          const totalPaid = salaryPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
          const remaining = amount - totalPaid

          gender.tous.total += amount
          gender.tous.regle += totalPaid
          gender.tous.nonRegle += remaining

          const g = user.gender === 'man' ? 'homme' : user.gender === 'woman' ? 'femme' : null
          if (g) {
            gender[g].total += amount
            gender[g].regle += totalPaid
            gender[g].nonRegle += remaining
          }
        }

        setGenderData(gender)

        const rows = []
        for (const p of payments) {
          const salary = salaryMap[p.fk_salary]
          if (!salary) continue
          const user = userMap[salary.fk_user]
          if (!user || user.admin === '1') continue

          const d = parseDateVal(p.datep || p.datepaye)
          if (d) {
            rows.push({
              date: d,
              month: d.getMonth(),
              year: d.getFullYear(),
              employeeName: [user.lastname, user.firstname].filter(Boolean).join(' '),
              amount: parseFloat(p.amount) || 0,
            })
          }
        }

        rows.sort((a, b) => a.date - b.date)
        setPaymentRows(rows)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredRows = useMemo(() => {
    return paymentRows.filter((r) => {
      if (monthFilter !== '' && r.month !== parseInt(monthFilter)) return false
      if (yearFilter && r.year !== parseInt(yearFilter)) return false
      return true
    })
  }, [paymentRows, monthFilter, yearFilter])

  const totalFiltered = filteredRows.reduce((sum, r) => sum + r.amount, 0)

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'var(--danger)' }}>Erreur : {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Vue d'ensemble</p>
          <h1 style={{ margin: 0 }}>Tableau de bord</h1>
        </div>
        <div style={{ ...card, padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <FiCalendar style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          {today}
        </div>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={statCard}>
          <div style={iconBox('#3b82f6')}><FiUsers size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9' }}>{totalEmployees}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Employés</div>
          </div>
        </div>
        <div style={statCard}>
          <div style={iconBox('#8b5cf6')}><FiDollarSign size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9' }}>{totalSalaries}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Salaires</div>
          </div>
        </div>
        <div style={statCard}>
          <div style={iconBox('#10b981')}><FiTrendingUp size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9' }}>{formatAmount(genderData?.tous?.regle || 0)}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total réglé</div>
          </div>
        </div>
      </div>

      {/* Salaires par genre */}
      <div style={{ ...card, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>Salaires par genre</h2>
          <span style={{ fontSize: '0.8rem', color: '#4a5568' }}>{totalSalaries} salaires au total</span>
        </div>

        <GenderCard title="Tous les genres" data={genderData?.tous} color="#a78bfa" icon="all" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <GenderCard title="Homme" data={genderData?.homme} color="#3b82f6" icon="man" />
          <GenderCard title="Femme" data={genderData?.femme} color="#ec4899" icon="woman" />
        </div>
      </div>

      {/* Salaires réglés par mois */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Règlements par mois</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={filterSelect}>
              <option value="">Tous les mois</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={filterSelect}>
              <option value="">Toutes les années</option>
              {Array.from({ length: 21 }, (_, i) => 2020 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredRows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date de règlement</th>
                <th>Employé</th>
                <th style={{ textAlign: 'right' }}>Salaire réglé</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i}>
                  <td>{formatDateDisplay(r.date)}</td>
                  <td style={{ fontWeight: '500', color: '#f1f5f9' }}>{r.employeeName}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(r.amount)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #2d3748' }}>
                <td colSpan={2} style={{ fontWeight: '600', color: '#f1f5f9' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: '700', color: '#4ade80', fontSize: '1.05rem' }}>{formatAmount(totalFiltered)}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#4a5568', textAlign: 'center', padding: '2rem 0' }}>Aucun paiement trouvé.</p>
        )}
      </div>
    </div>
  )
}

function GenderCard({ title, data, color }) {
  if (!data) return null

  const pctRegle = data.total > 0 ? Math.round((data.regle / data.total) * 100) : 0

  return (
    <div style={{
      background: '#0f0f1a',
      borderRadius: '10px',
      padding: '1.25rem',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontWeight: '600', color, fontSize: '0.95rem' }}>{title}</span>
        <span style={{ fontSize: '0.75rem', color: '#4a5568', background: '#1a1a2e', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
          {pctRegle}% réglé
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Total</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>{formatAmount(data.total)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Réglé</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#4ade80' }}>{formatAmount(data.regle)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Non réglé</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f87171' }}>{formatAmount(data.nonRegle)}</div>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', height: '4px', background: '#1e1e2e', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pctRegle}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}
