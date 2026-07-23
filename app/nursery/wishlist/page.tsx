export const dynamic = 'force-dynamic'
import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import PlantWishlistClient from './PlantWishlistClient'

export default async function PlantWishlistPage() {
  const h = headers()
  const user = h.get('x-user') || 'user'
  const role = h.get('x-role') || 'viewer'
  return (
    <AppShell user={user} role={role} title="Plant Wishlist" subtitle="Preferred plants & trees to grow in our nursery">
      <PlantWishlistClient role={role} />
    </AppShell>
  )
}
