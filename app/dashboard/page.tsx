import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user') || ''} role={h.get('x-role') || ''} title="Dashboard" subtitle="Tree management overview">
      <DashboardClient />
    </AppShell>
  )
}
