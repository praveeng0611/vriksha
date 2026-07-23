import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import RemindersClient from './RemindersClient'

export default function RemindersPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Reminders" subtitle="Maintenance schedule and alerts">
      <RemindersClient role={h.get('x-role')||''} />
    </AppShell>
  )
}
