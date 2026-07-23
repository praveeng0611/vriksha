'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DashboardStats } from '@/types'

function HealthBadge({ status }: { status: string }) {
  return <span className={`health-badge health-${status}`}>{status}</span>
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => { fetch('/api/dashboard').then(r => r.json()).then(setStats) }, [])

  if (!stats) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading…</div>

  const survivalColor = stats.survival_pct >= 80 ? '#15803d' : stats.survival_pct >= 60 ? '#d97706' : '#dc2626'

  return (
    <div>
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Trees',    value: stats.total_trees,    icon: '🌳', color: '#2d7a3a' },
          { label: 'Alive Trees',    value: stats.alive_trees,    icon: '💚', color: '#059669' },
          { label: 'Dead Trees',     value: stats.dead_trees,     icon: '💀', color: '#dc2626' },
          { label: 'Survival Rate',  value: `${stats.survival_pct}%`, icon: '📈', color: survivalColor },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span style={{ fontSize: '1.75rem' }}>{s.icon}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Projects',   value: stats.total_projects,    icon: '📋' },
          { label: 'Species',           value: stats.total_species,     icon: '🍃' },
          { label: 'Total Expense',     value: `₹${Number(stats.total_expense).toLocaleString('en-IN')}`, icon: '💰' },
          { label: 'Overdue Reminders', value: stats.reminders_overdue, icon: '⚠️', color: stats.reminders_overdue > 0 ? '#dc2626' : undefined },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Survival bar */}
      <div className="card mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Survival Rate</span>
          <span style={{ fontWeight: 800, color: survivalColor }}>{stats.survival_pct}%</span>
        </div>
        <div style={{ height: 12, background: '#f0f7f0', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stats.survival_pct}%`, background: survivalColor, borderRadius: 999, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>🟢 {stats.alive_trees} alive</span>
          <span>💀 {stats.dead_trees} dead</span>
        </div>
      </div>

      {/* Reminders alert */}
      {(stats.reminders_overdue > 0 || stats.reminders_today > 0) && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
            ⚠️ {stats.reminders_overdue > 0 ? `${stats.reminders_overdue} overdue` : ''}{stats.reminders_overdue > 0 && stats.reminders_today > 0 ? ' · ' : ''}{stats.reminders_today > 0 ? `${stats.reminders_today} due today` : ''} maintenance tasks
          </span>
          <Link href="/reminders" className="btn btn-sm" style={{ background: '#92400e', color: 'white' }}>View →</Link>
        </div>
      )}

      {/* Recent trees */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Recently Added Trees</h2>
          <Link href="/trees" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {stats.recent_trees.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No trees yet. <Link href="/trees/new" style={{ color: 'var(--primary)' }}>Register the first tree →</Link></p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Tree Code</th><th>Species</th><th>Project</th><th>Health</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats.recent_trees.map((t: any, i: number) => (
                <tr key={t.id}>
                  <td data-label="#">{i+1}</td>
                  <td data-label="Code"><Link href={`/trees/${t.id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{t.tree_code}</Link></td>
                  <td data-label="Species">{t.species_local || '—'}</td>
                  <td data-label="Project">{t.project_name || '—'}</td>
                  <td data-label="Health"><HealthBadge status={t.health_status} /></td>
                  <td data-label="Date" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.plantation_date ? new Date(t.plantation_date).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
