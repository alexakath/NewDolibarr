import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuthCode } from '../api/backend'

export default function LoginPage() {
  const [code, setCode] = useState('ADMIN2025')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await checkAuthCode(code)
      sessionStorage.setItem('backoffice_auth', 'true')
      navigate('/backoffice/dashboard')
    } catch {
      setError('Code incorrect')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <h1>Accès Backoffice</h1>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code d'accès"
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button type="submit" style={{ padding: '0.5rem', fontSize: '1rem', cursor: 'pointer' }}>
          Entrer
        </button>
      </form>
    </div>
  )
}
