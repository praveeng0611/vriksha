import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import OwnersClient from './OwnersClient'

export default function OwnersPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Owners" subtitle="Tree owner management">
      <OwnersClient role={h.get('x-role')||''} endpoint="/api/owners" label="Owner" />
    </AppShell>
  )
}
