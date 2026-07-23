export const dynamic = 'force-dynamic'
import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import NurseryInventoryClient from './NurseryInventoryClient'

export default async function NurseryInventoryPage() {
  const h = headers()
  const user = h.get('x-user') || 'user'
  const role = h.get('x-role') || 'viewer'
  return (
    <AppShell user={user} role={role} title="Nursery Sapling Inventory" subtitle="Track sapling batches, stock levels and condition">
      <NurseryInventoryClient role={role} />
    </AppShell>
  )
}
