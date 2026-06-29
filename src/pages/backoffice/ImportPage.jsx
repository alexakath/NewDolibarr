import { useState } from 'react'
import { FiUpload, FiFile, FiImage, FiX, FiCheckCircle, FiAlertTriangle, FiXCircle, FiUsers, FiDollarSign } from 'react-icons/fi'
import { runImport } from '../../services/importService'
import { syncAll } from '../../services/syncService'
import { logImport } from '../../api/backend'

const card = {
  background: '#12121e',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #1e1e2e',
}

const btnOutline = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  background: 'transparent',
  border: '1px solid #2d3748',
  borderRadius: '8px',
  color: '#94a3b8',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const btnActive = {
  ...btnOutline,
  background: '#3b82f620',
  borderColor: '#3b82f6',
  color: '#3b82f6',
}

const fileRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: '#0f0f1a',
  borderRadius: '8px',
  marginTop: '0.75rem',
}

const badgeStyle = {
  padding: '0.2rem 0.6rem',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: '500',
  background: '#1a1a2e',
  color: '#94a3b8',
}

export default function ImportPage() {
  const [employeeFile, setEmployeeFile] = useState(null)
  const [salaryFile, setSalaryFile] = useState(null)
  const [zipFile, setZipFile] = useState(null)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState(null)
  const [importing, setImporting] = useState(false)

  const files = [
    { file: employeeFile, label: 'Employés', type: 'CSV', set: setEmployeeFile },
    { file: salaryFile, label: 'Salaires', type: 'CSV', set: setSalaryFile },
    { file: zipFile, label: 'Images', type: 'ZIP', set: setZipFile },
  ].filter(f => f.file)

  const steps = []
  if (employeeFile) steps.push({ n: steps.length + 1, label: 'Employés', fileName: employeeFile.name })
  if (zipFile) steps.push({ n: steps.length + 1, label: 'Images', fileName: zipFile.name })
  if (salaryFile) steps.push({ n: steps.length + 1, label: 'Salaires', fileName: salaryFile.name })

  async function handleImport() {
    if (!employeeFile || !salaryFile) {
      setStatus('Veuillez sélectionner les 2 fichiers CSV.')
      return
    }

    setImporting(true)
    setReport(null)
    setProgress(0)

    try {
      const result = await runImport(employeeFile, salaryFile, zipFile, (step, message, pct) => {
        setStatus(message)
        if (pct !== undefined) setProgress(pct)
      })
      setReport(result)

      await logImport('employees', result.employees?.success || 0, result.employees?.errors?.length || 0)
      await logImport('salaries', result.salaries?.success || 0, result.salaries?.errors?.length || 0)
      if (result.images) await logImport('images', result.images?.success || 0, result.images?.errors?.length || 0)

      setStatus('Synchronisation avec SQLite...')
      await syncAll()
      setStatus('Import terminé et synchronisé.')
    } catch (err) {
      setStatus(`Erreur: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ maxWidth: '750px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: '#4a5568', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>Données</p>
          <h1 style={{ margin: 0 }}>Import</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '320px', textAlign: 'right', lineHeight: '1.5' }}>
          Ajoutez vos fichiers CSV et ZIP — les données seront importées dans Dolibarr et synchronisées avec SQLite.
        </p>
      </div>

      {/* Fichiers */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: files.length > 0 ? '0.5rem' : 0 }}>
          <span style={{ color: '#4a5568', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>Fichiers</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label style={employeeFile && salaryFile ? btnOutline : btnActive}>
              <FiFile size={14} />
              + CSV
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (!employeeFile) setEmployeeFile(e.target.files[0])
                  else setSalaryFile(e.target.files[0])
                }}
              />
            </label>
            <label style={zipFile ? btnOutline : btnActive}>
              <FiImage size={14} />
              + Images ZIP
              <input type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => setZipFile(e.target.files[0])} />
            </label>
          </div>
        </div>

        {files.length === 0 && (
          <p style={{ color: '#4a5568', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
            Aucun fichier sélectionné
          </p>
        )}

        {files.map((f, i) => (
          <div key={i} style={fileRow}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: f.type === 'ZIP' ? '#f59e0b15' : '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.type === 'ZIP' ? '#f59e0b' : '#3b82f6', flexShrink: 0 }}>
              {f.type === 'ZIP' ? <FiImage size={16} /> : <FiFile size={16} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', color: '#f1f5f9', fontSize: '0.9rem' }}>{f.file.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.1rem' }}>
                {(f.file.size / 1024).toFixed(1)} Ko
              </div>
            </div>
            <span style={badgeStyle}>{f.label}</span>
            <button
              onClick={() => f.set(null)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
            >
              <FiX size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Plan d'import */}
      {steps.length > 0 && (
        <div style={{ ...card, marginTop: '1rem', borderColor: '#3b82f630' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#4a5568', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>Plan d'import</span>
            <span style={{ ...badgeStyle, background: '#3b82f620', color: '#3b82f6' }}>{steps.length} étape{steps.length > 1 ? 's' : ''}</span>
          </div>
          {steps.map((s) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', width: '1.5rem' }}>{s.n}</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4a5568' }} />
              <span style={{ fontWeight: '500', color: '#f1f5f9', fontSize: '0.9rem' }}>{s.label}</span>
              <span style={{ color: '#4a5568', fontSize: '0.8rem', fontStyle: 'italic', marginLeft: 'auto' }}>{s.fileName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bouton import */}
      {steps.length > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: 'auto',
            padding: '0.85rem 2rem',
            marginTop: '1.5rem',
            background: importing ? '#2d3748' : '#3b82f6',
            color: importing ? '#64748b' : 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: importing ? 'not-allowed' : 'pointer',
          }}
        >
          <FiUpload size={18} />
          {importing ? 'Import en cours...' : `Lancer l'import · ${steps.length} étape${steps.length > 1 ? 's' : ''}`}
        </button>
      )}

      {/* Progression */}
      {status && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ color: '#e2e8f0', fontWeight: '500', fontSize: '0.9rem' }}>{status}</p>
          {importing && (
            <div style={{ background: '#1e1e2e', borderRadius: '6px', overflow: 'hidden', height: '6px', marginTop: '0.5rem' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', borderRadius: '6px', transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      )}

      {/* Rapport */}
      {report && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Résultat de l'import</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <ModuleReport
              title="Module Employés"
              color="#3b82f6"
              icon={FiUsers}
              items={[
                { label: 'Employés', data: report.employees },
                { label: 'Images', data: report.images },
              ]}
            />
            <ModuleReport
              title="Module Salaires"
              color="#8b5cf6"
              icon={FiDollarSign}
              items={[
                { label: 'Salaires', data: report.salaries },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ModuleReport({ title, color, icon: Icon, items }) {
  const totalSuccess = items.reduce((sum, it) => sum + (it.data?.success || 0), 0)
  const totalErrors = items.reduce((sum, it) => sum + (it.data?.errors?.length || 0), 0)
  const hasErrors = totalErrors > 0

  return (
    <div style={{ ...card, borderLeft: `3px solid ${hasErrors ? '#f87171' : '#4ade80'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          <Icon size={20} />
        </div>
        <span style={{ flex: 1, fontWeight: '600', color: '#f1f5f9', fontSize: '1rem' }}>{title}</span>
        <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.9rem' }}>
          <FiCheckCircle size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
          {totalSuccess} importé(s)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => {
          if (!item.data) return null
          const itemErrors = item.data.errors?.length > 0
          const itemWarnings = item.data.warnings?.length > 0

          return (
            <div key={idx} style={{ background: '#0f0f1a', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{item.label}</span>
                <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: '500' }}>{item.data.success} ok</span>
              </div>

              {itemWarnings && item.data.warnings.map((w, i) => (
                <div key={`w-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#fbbf24' }}>
                  <FiAlertTriangle size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {w.message}
                </div>
              ))}

              {itemErrors && item.data.errors.map((err, i) => (
                <div key={`e-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#f87171' }}>
                  <FiXCircle size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {err.line ? `Ligne ${err.line} : ` : ''}{err.message}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
