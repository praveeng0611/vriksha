import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import OwnersClient from '../owners/OwnersClient'

export default function CaretakersPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Caretakers" subtitle="Tree caretaker management">
      <OwnersClient role={h.get('x-role')||''} endpoint="/api/caretakers" label="Caretaker" showTreeCount />
    </AppShell>
  )
}
