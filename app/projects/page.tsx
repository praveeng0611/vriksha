import { headers } from 'next/headers'
import AppShell from '@/components/AppShell'
import ProjectsClient from './ProjectsClient'

export default function ProjectsPage() {
  const h = headers()
  return (
    <AppShell user={h.get('x-user')||''} role={h.get('x-role')||''} title="Projects" subtitle="Plantation project management">
      <ProjectsClient role={h.get('x-role')||''} />
    </AppShell>
  )
}
