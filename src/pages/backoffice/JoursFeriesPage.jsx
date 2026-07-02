import { useState, useEffect } from 'react'
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { getJoursFeries, createJourFerie, updateJourFerie, deleteJourFerie } from '../../api/backend'

export default function JoursFeriesPage() {
  const [jours, setJours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newDate, setNewDate] = useState('')
  const [newLibelle, setNewLibelle] = useState('')
  const [adding, setAdding] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editLibelle, setEditLibelle] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setJours(await getJoursFeries())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newDate || !newLibelle.trim()) return
    setAdding(true)
    try {
      await createJourFerie(newDate, newLibelle.trim())
      setNewDate('')
      setNewLibelle('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  function startEdit(jour) {
    setEditId(jour.id)
    setEditDate(jour.date)
    setEditLibelle(jour.libelle)
  }

  function cancelEdit() {
    setEditId(null)
    setEditDate('')
    setEditLibelle('')
  }

  async function handleSave(id) {
    if (!editDate || !editLibelle.trim()) return
    try {
      await updateJourFerie(id, editDate, editLibelle.trim())
      cancelEdit()
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce jour férié ?')) return
    try {
      await deleteJourFerie(id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FiCalendar size={24} color="#3b82f6" />
        <div>
          <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>Jours fériés</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Données locales — indépendantes de Dolibarr</p>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div style={{ background: '#12121e', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Ajouter un jour férié
        </p>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            required
            style={{ flex: '0 0 180px' }}
          />
          <input
            type="text"
            placeholder="Libellé (ex: Fête du Travail)"
            value={newLibelle}
            onChange={e => setNewLibelle(e.target.value)}
            required
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button
            type="submit"
            disabled={adding}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.25rem', background: '#3b82f6', border: 'none',
              borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer',
              opacity: adding ? 0.6 : 1,
            }}
          >
            <FiPlus size={16} />
            {adding ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: '#2d1b1b', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Tableau */}
      <div style={{ background: '#12121e', border: '1px solid #1e1e2e', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Liste
          </span>
          <span style={{ background: '#1e293b', color: '#64748b', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
            {jours.length} enregistrement{jours.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#4a5568' }}>Chargement...</div>
        ) : jours.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#4a5568' }}>Aucun jour férié enregistré.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', color: '#4a5568', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', width: '160px' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#4a5568', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Libellé</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', color: '#4a5568', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jours.map((jour, idx) => (
                <tr key={jour.id} style={{ borderBottom: idx < jours.length - 1 ? '1px solid #1a1a2a' : 'none', background: idx % 2 === 0 ? 'transparent' : '#0f0f1a' }}>
                  {editId === jour.id ? (
                    <>
                      <td style={{ padding: '0.6rem 1.5rem' }}>
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }} />
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <input type="text" value={editLibelle} onChange={e => setEditLibelle(e.target.value)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', width: '100%' }} />
                      </td>
                      <td style={{ padding: '0.6rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleSave(jour.id)} style={{ background: '#166534', border: 'none', borderRadius: '5px', color: '#86efac', padding: '0.35rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                            <FiCheck size={13} /> Sauvegarder
                          </button>
                          <button onClick={cancelEdit} style={{ background: '#1e1e2e', border: '1px solid #2d3748', borderRadius: '5px', color: '#94a3b8', padding: '0.35rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                            <FiX size={13} /> Annuler
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                        {formatDate(jour.date)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontSize: '0.9rem' }}>
                        {jour.libelle}
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(jour)} style={{ background: '#1e293b', border: '1px solid #2d3748', borderRadius: '5px', color: '#94a3b8', padding: '0.35rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                            <FiEdit2 size={13} /> Modifier
                          </button>
                          <button onClick={() => handleDelete(jour.id)} style={{ background: '#2d1b1b', border: '1px solid #7f1d1d', borderRadius: '5px', color: '#f87171', padding: '0.35rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                            <FiTrash2 size={13} /> Supprimer
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
