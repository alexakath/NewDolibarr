import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import EmployeeListPage from './pages/frontoffice/EmployeeListPage'
import EmployeePaymentsPage from './pages/frontoffice/EmployeePaymentsPage'
import SalaryPage from './pages/frontoffice/SalaryPage'
import CreateSalaryPage from './pages/frontoffice/CreateSalaryPage'
import BulkSalaryPage from './pages/frontoffice/BulkSalaryPage'
import BulkSalaryByMonthPage from './pages/frontoffice/BulkSalaryByMonthPage'
import LoginPage from './auth/LoginPage'
import AuthGuard from './auth/AuthGuard'
import DashboardPage from './pages/backoffice/DashboardPage'
import ImportPage from './pages/backoffice/ImportPage'
import ResetPage from './pages/backoffice/ResetPage'
import JoursFeriesPage from './pages/backoffice/JoursFeriesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/backoffice" element={<LoginPage />} />

        <Route element={<Layout />}>
          {/* Frontoffice (public) */}
          <Route path="/" element={<EmployeeListPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/:id/payments" element={<EmployeePaymentsPage />} />
          <Route path="/salaries" element={<SalaryPage />} />
          <Route path="/salaries/create" element={<CreateSalaryPage />} />
          <Route path="/salaries/bulk" element={<BulkSalaryPage />} />
          <Route path="/salaries/bulk-month" element={<BulkSalaryByMonthPage />} />

          {/* Backoffice (protégé) */}
          <Route path="/backoffice/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/backoffice/import" element={<AuthGuard><ImportPage /></AuthGuard>} />
          <Route path="/backoffice/reset" element={<AuthGuard><ResetPage /></AuthGuard>} />
          <Route path="/backoffice/jours-feries" element={<AuthGuard><JoursFeriesPage /></AuthGuard>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
