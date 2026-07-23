'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Expense = { id: number; tree_id?: number; tree_code?: string; project_name?: string; category: string; date: string; amount: number; vendor?: string; payment_mode?: string; remarks?: string }
const CATS = ['plant','transport','pit_digging','labour','water','fertilizer','tree_guard','maintenance','miscellaneous']

export default function ExpensesClient({ role }: { role: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filter, setFilter]     = useState('')

  useEffect(() => { fetch('/api/expenses').then(r => r.json()).then(setExpenses) }, [])

  const filtered = filter ? expenses.filter(e => e.category === filter) : expenses
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)
  const byCategory = CATS.reduce((acc, c) => {
    acc[c] = expenses.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount), 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* Category breakdown */}
      <div className="card mb-4">
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Category Breakdown</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CATS.filter(c => byCategory[c] > 0).map(c => (
            <div key={c} style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.83rem' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>{c.replace('_',' ')}</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{byCategory[c].toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
          Total: ₹{expenses.reduce((s,e) => s + Number(e.amount), 0).toLocaleString('en-IN')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select className="form-input" style={{ maxWidth: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATS.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length} records · ₹{total.toLocaleString('en-IN')}</span>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Tree</th><th>Category</th><th>Amount</th><th>Vendor</th><th>Mode</th><th>Remarks</th></tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td data-label="Date">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td data-label="Tree">{e.tree_id ? <Link href={`/trees/${e.tree_id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{e.tree_code || e.tree_id}</Link> : e.project_name || '—'}</td>
                <td data-label="Category"><span className="activity-pill">{e.category.replace('_',' ')}</span></td>
                <td data-label="Amount" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                <td data-label="Vendor">{e.vendor || '—'}</td>
                <td data-label="Mode">{e.payment_mode || '—'}</td>
                <td data-label="Remarks" style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{e.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses yet.</div>}
      </div>
    </div>
  )
}
