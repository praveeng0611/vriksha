import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import SearchClient from './SearchClient'

export default function SearchPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Search" subtitle="Find trees, projects, owners">
      <SearchClient />
    </AppShell>
  )
}
