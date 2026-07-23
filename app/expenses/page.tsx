import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import ExpensesClient from './ExpensesClient'

export default function ExpensesPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Expenses" subtitle="Plantation and maintenance cost tracking">
      <ExpensesClient role={h.get('x-role')||''} />
    </AppShell>
  )
}
