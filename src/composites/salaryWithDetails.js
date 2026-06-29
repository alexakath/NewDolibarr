import { getSalaries, getPayments } from '../services/salaryService'
import { getUsers } from '../services/userService'

export async function getSalariesWithDetails() {
  const [salaries, users, payments] = await Promise.all([
    getSalaries(),
    getUsers(),
    getPayments().catch(() => []),
  ])

  const userMap = {}
  for (const user of users) {
    userMap[user.id] = user
  }

  const paymentsBySalary = {}
  for (const p of payments) {
    const salaryId = p.fk_salary || p.fk_typepayment
    if (!paymentsBySalary[salaryId]) paymentsBySalary[salaryId] = []
    paymentsBySalary[salaryId].push(p)
  }

  return salaries.map((salary) => {
    const user = userMap[salary.fk_user] || {}
    const salaryPayments = paymentsBySalary[salary.id] || []
    const totalPaid = salaryPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    return {
      ...salary,
      employeeName: [user.lastname, user.firstname].filter(Boolean).join(' ') || '-',
      employeeGender: user.gender || '-',
      employeeRef: user.ref_employee || user.id,
      payments: salaryPayments,
      totalPaid,
    }
  })
}
