import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiUsers, FiDollarSign, FiPlusCircle, FiBarChart2, FiUpload, FiRefreshCw, FiLogOut, FiArrowRight, FiUser, FiCalendar, FiZap, FiCreditCard } from 'react-icons/fi'

const sidebarStyle = {
  width: '240px',
  minHeight: '100vh',
  background: '#0f0f1a',
  borderRight: '1px solid #1e1e2e',
  padding: '1.5rem 0',
  position: 'fixed',
  left: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'column',
}

const logoStyle = {
  color: '#e2e8f0',
  fontSize: '1.2rem',
  fontWeight: '700',
  padding: '0 1.25rem',
  marginBottom: '0.5rem',
  letterSpacing: '0.5px',
}

const sectionLabel = {
  color: '#4a5568',
  fontSize: '0.7rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  padding: '1.25rem 1.25rem 0.5rem',
}

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 1.25rem',
  textDecoration: 'none',
  color: '#94a3b8',
  fontSize: '0.9rem',
  borderLeft: '3px solid transparent',
  transition: 'all 0.15s ease',
}

const linkActive = {
  ...linkBase,
  color: '#e2e8f0',
  background: '#1e1e2e',
  borderLeftColor: '#3b82f6',
}

const switchBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 1.25rem',
  background: 'none',
  border: '1px solid #2d3748',
  borderRadius: '6px',
  color: '#94a3b8',
  fontSize: '0.85rem',
  cursor: 'pointer',
  margin: '0 1rem',
  transition: 'all 0.15s ease',
}

const logoutBtnStyle = {
  ...switchBtnStyle,
  borderColor: '#e53e3e33',
  color: '#fc8181',
}

const userBadge = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  margin: '0 1rem 0.75rem',
  background: '#1a1a2e',
  borderRadius: '8px',
  color: '#a0aec0',
  fontSize: '0.8rem',
}

function SideLink({ to, icon: Icon, children }) {
  return (
    <NavLink to={to} style={({ isActive }) => isActive ? linkActive : linkBase}>
      <Icon size={18} />
      {children}
    </NavLink>
  )
}

export function FrontSidebar() {
  const navigate = useNavigate()

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>NewApp</div>
      <div style={{ fontSize: '0.7rem', color: '#4a5568', padding: '0 1.25rem', marginBottom: '1rem' }}>
        Dolibarr × React
      </div>

      <p style={sectionLabel}>Frontoffice</p>
      <SideLink to="/employees" icon={FiUsers}>Salariés</SideLink>
      <SideLink to="/salaries" icon={FiDollarSign}>Salaires</SideLink>
      <SideLink to="/salaries/create" icon={FiPlusCircle}>Gestion salaires</SideLink>
      <SideLink to="/salaries/bulk" icon={FiZap}>Salaires collectifs</SideLink>
      <SideLink to="/salaries/bulk-month" icon={FiZap}>Salaires par mois</SideLink>
      <SideLink to="/salaries/pay-month" icon={FiZap}>Paiement par mois</SideLink>

      <div style={{ flex: 1 }} />

      <button style={switchBtnStyle} onClick={() => navigate('/backoffice')}>
        <FiArrowRight size={16} />
        Accéder au backoffice
      </button>
      <div style={{ height: '1rem' }} />
    </div>
  )
}

export function BackSidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    sessionStorage.removeItem('backoffice_auth')
    navigate('/backoffice')
  }

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>NewApp</div>
      <div style={{ fontSize: '0.7rem', color: '#4a5568', padding: '0 1.25rem', marginBottom: '1rem' }}>
        Dolibarr × React
      </div>

      <div style={userBadge}>
        <FiUser size={16} />
        <span>Administrateur</span>
      </div>

      <p style={sectionLabel}>Backoffice</p>
      <SideLink to="/backoffice/dashboard" icon={FiBarChart2}>Dashboard</SideLink>
      <SideLink to="/backoffice/import" icon={FiUpload}>Import</SideLink>
      <SideLink to="/backoffice/reset" icon={FiRefreshCw}>Réinitialisation</SideLink>
      <SideLink to="/backoffice/jours-feries" icon={FiCalendar}>Jours fériés</SideLink>

      <div style={{ flex: 1 }} />

      <button style={switchBtnStyle} onClick={() => navigate('/employees')}>
        <FiArrowRight size={16} />
        Aller au frontoffice
      </button>
      <div style={{ height: '0.5rem' }} />
      <button style={logoutBtnStyle} onClick={handleLogout}>
        <FiLogOut size={16} />
        Déconnexion
      </button>
      <div style={{ height: '1rem' }} />
    </div>
  )
}
