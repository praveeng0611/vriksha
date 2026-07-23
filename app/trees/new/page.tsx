import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import NewTreeClient from './NewTreeClient'

export default function NewTreePage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Register Tree" subtitle="Add a new geo-tagged tree">
      <NewTreeClient user={h.get('x-user')||''} />
    </AppShell>
  )
}
