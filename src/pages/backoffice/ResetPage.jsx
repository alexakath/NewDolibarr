import { useState, useEffect } from 'react'
import { FiTrash2, FiAlertTriangle, FiCheckCircle, FiXCircle, FiDollarSign, FiUsers, FiImage, FiDatabase } from 'react-icons/fi'
import { getResetStats, runReset } from '../../services/resetService'

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #1e1e2e',
}

const iconBox = (color) => ({
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: `${color}15`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color,
  flexShrink: 0,
})

const MODULE_META = {
  salaries: { icon: FiDollarSign, color: '#8b5cf6' },
  employees: { icon: FiUsers, color: '#3b82f6' },
  images: { icon: FiImage, color: '#f59e0b' },
  sqlite: { icon: FiDatabase, color: '#10b981' },
}

export default function ResetPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState(null)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getResetStats()
      setStats(data)
    } catch (err) {
      setStatus(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les données importées ?')) return

    setResetting(true)
    setReport(null)
    setProgress(0)

    try {
      const result = await runReset((step, message, pct) => {
        setStatus(message)
        if (pct !== undefined) setProgress(pct)
      })
      setReport(result)
      setStatus('Réinitialisation terminée.')
      loadStats()
    } catch (err) {
      setStatus(`Erreur: ${err.message}`)
    } finally {
      setResetting(false)
    }
  }

  const totalItems = stats ? Object.values(stats).reduce((sum, s) => sum + s.count, 0) : 0

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Maintenance</p>
          <h1 style={{ margin: 0 }}>Réinitialisation</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '300px', textAlign: 'right', lineHeight: '1.5' }}>
          Supprime toutes les données importées dans Dolibarr et SQLite.
        </p>
      </div>

      {/* Alerte */}
      <div style={{ ...card, borderColor: '#f5920b30', display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={iconBox('#f59e0b')}><FiAlertTriangle size={20} /></div>
        <div>
          <div style={{ fontWeight: '600', color: '#fbbf24', fontSize: '0.9rem' }}>Attention — action irréversible</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Cette action supprimera les salaires, employés, images et le cache SQLite. Les données devront être réimportées.
          </div>
        </div>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Chargement des statistiques...</p>}

      {/* Stats actuelles */}
      {stats && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ color: '#4a5568', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>Données actuelles</span>
            <span style={{ fontSize: '0.8rem', color: totalItems > 0 ? '#f87171' : '#4ade80', background: '#1a1a2e', padding: '0.2rem 0.75rem', borderRadius: '20px' }}>
              {totalItems} élément{totalItems > 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(stats).map(([key, data]) => {
              const meta = MODULE_META[key] || { icon: FiDatabase, color: '#64748b' }
              const Icon = meta.icon
              return (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: '#0f0f1a',
                  borderRadius: '8px',
                }}>
                  <div style={iconBox(meta.color)}><Icon size={18} /></div>
                  <span style={{ flex: 1, fontWeight: '500', color: '#f1f5f9', fontSize: '0.9rem' }}>{data.label}</span>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: data.count > 0 ? '#f1f5f9' : '#4a5568',
                  }}>
                    {data.count}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleReset}
            disabled={resetting || totalItems === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.85rem',
              marginTop: '1.5rem',
              background: resetting || totalItems === 0 ? '#2d3748' : '#e53e3e',
              color: resetting || totalItems === 0 ? '#64748b' : 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: resetting || totalItems === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <FiTrash2 size={18} />
            {resetting ? 'Suppression en cours...' : 'Réinitialiser toutes les données'}
          </button>
        </div>
      )}

      {/* Progression */}
      {status && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ color: '#e2e8f0', fontWeight: '500', fontSize: '0.9rem' }}>{status}</p>
          {resetting && (
            <div style={{ background: '#1e1e2e', borderRadius: '6px', overflow: 'hidden', height: '6px', marginTop: '0.5rem' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#e53e3e', borderRadius: '6px', transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      )}

      {/* Rapport */}
      {report && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Résultat</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <ResetModuleReport
              title="Module Employés"
              color="#3b82f6"
              icon={FiUsers}
              items={[
                { label: 'Employés (Dolibarr)', data: report.employees },
                { label: 'Images', data: report.images },
              ]}
            />
            <ResetModuleReport
              title="Module Salaires"
              color="#8b5cf6"
              icon={FiDollarSign}
              items={[
                { label: 'Salaires (Dolibarr)', data: report.salaries },
              ]}
            />
            <ResetModuleReport
              title="Cache local"
              color="#10b981"
              icon={FiDatabase}
              items={[
                { label: 'SQLite', data: report.sqlite },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ResetModuleReport({ title, color, icon: Icon, items }) {
  const totalSuccess = items.reduce((sum, it) => sum + (it.data?.success || 0), 0)
  const totalErrors = items.reduce((sum, it) => sum + (it.data?.errors?.length || 0), 0)
  const hasErrors = totalErrors > 0

  return (
    <div style={{ ...card, borderLeft: `3px solid ${hasErrors ? '#f87171' : '#4ade80'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={iconBox(color)}><Icon size={20} /></div>
        <span style={{ flex: 1, fontWeight: '600', color: '#f1f5f9', fontSize: '1rem' }}>{title}</span>
        <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.9rem' }}>
          <FiCheckCircle size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
          {totalSuccess} supprimé(s)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => {
          if (!item.data) return null
          const itemErrors = item.data.errors?.length > 0

          return (
            <div key={idx} style={{ background: '#0f0f1a', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{item.label}</span>
                <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: '500' }}>{item.data.success} ok</span>
              </div>

              {itemErrors && item.data.errors.map((err, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#f87171' }}>
                  <FiXCircle size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                  ID {err.id} : {err.message}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
