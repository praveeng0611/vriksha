import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import TreesClient from './TreesClient'

export default function TreesPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="All Trees" subtitle="View and manage registered trees">
      <TreesClient user={h.get('x-user')||''} role={h.get('x-role')||''} />
    </AppShell>
  )
}
