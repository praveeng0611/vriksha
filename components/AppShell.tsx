'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { section: 'Overview' },
  { href: '/dashboard',  label: 'Dashboard',    icon: '📊' },
  { section: 'Trees' },
  { href: '/trees',      label: 'All Trees',     icon: '🌳' },
  { href: '/trees/new',  label: 'Register Tree', icon: '➕' },
  { href: '/projects',   label: 'Projects',      icon: '📋' },
  { section: 'People' },
  { href: '/owners',     label: 'Owners',        icon: '👤' },
  { href: '/caretakers', label: 'Caretakers',    icon: '🧑‍🌾' },
  { section: 'Activity' },
  { href: '/maintenance',label: 'Maintenance',   icon: '🔧' },
  { href: '/expenses',   label: 'Expenses',      icon: '💰' },
  { href: '/reminders',  label: 'Reminders',     icon: '🔔' },
  { section: 'Tools' },
  { href: '/search',     label: 'Search',        icon: '🔍' },
  { href: '/settings',   label: 'Settings',      icon: '⚙️', adminOnly: true },
]

interface Props {
  user: string
  role: string
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AppShell({ user, role, children, title, subtitle }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🌳 Vriksha</h1>
          <p>Tree Management</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            if ('section' in item) return (
              <div key={i} className="nav-section">
                <div className="nav-label">{item.section}</div>
              </div>
            )
            if (item.adminOnly && role !== 'admin') return null
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!))
            return (
              <Link key={item.href} href={item.href!} className={`nav-item ${active ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: '0.5rem' }}>
            {user} · {role}
          </div>
          <button onClick={logout} className="nav-item" style={{ width: '100%', padding: '0.4rem 0' }}>
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {(title || subtitle) && (
          <div className="page-header">
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
