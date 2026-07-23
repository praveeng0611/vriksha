import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import SettingsClient from './SettingsClient'

export default function SettingsPage() {
  const h = headers()
  const role = h.get('x-role') || ''
  if (role !== 'admin') redirect('/dashboard')
  return (
    <AppShell user={h.get('x-user')||''} role={role} title="Settings" subtitle="User management and system configuration">
      <SettingsClient />
    </AppShell>
  )
}
