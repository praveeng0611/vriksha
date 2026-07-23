import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import MaintenanceClient from './MaintenanceClient'

export default function MaintenancePage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Maintenance Logs" subtitle="All tree maintenance activities">
      <MaintenanceClient role={h.get('x-role')||''} />
    </AppShell>
  )
}
