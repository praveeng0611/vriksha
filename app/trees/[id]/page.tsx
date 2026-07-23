import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import TreeDetailClient from './TreeDetailClient'

export default function TreeDetailPage({ params }: { params: { id: string } }) {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''}>
      <TreeDetailClient id={params.id} user={h.get('x-user')||''} role={h.get('x-role')||''} />
    </AppShell>
  )
}
