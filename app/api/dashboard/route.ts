export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET() {
  await initDB()

  const [totals, recentTrees, overdueReminders, todayReminders] = await Promise.all([
    sql`
      SELECT
        COUNT(*) AS total_trees,
        COUNT(*) FILTER (WHERE health_status != 'dead') AS alive_trees,
        COUNT(*) FILTER (WHERE health_status = 'dead')  AS dead_trees,
        ROUND(100.0 * COUNT(*) FILTER (WHERE health_status != 'dead') / NULLIF(COUNT(*),0), 1) AS survival_pct
      FROM trees
    `,
    sql`
      SELECT t.id, t.tree_code, t.health_status, t.health_score, t.plantation_date,
             s.local_name AS species_local, p.name AS project_name
      FROM trees t
      LEFT JOIN species s ON s.id = t.species_id
      LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.created_at DESC LIMIT 8
    `,
    sql`SELECT COUNT(*) AS cnt FROM reminders WHERE status = 'overdue'`,
    sql`SELECT COUNT(*) AS cnt FROM reminders WHERE next_due = CURRENT_DATE AND status = 'pending'`,
  ])

  const [projectCount, speciesCount, totalExpense] = await Promise.all([
    sql`SELECT COUNT(*) AS cnt FROM projects WHERE status = 'active'`,
    sql`SELECT COUNT(*) AS cnt FROM species`,
    sql`SELECT COALESCE(SUM(amount),0) AS total FROM expenses`,
  ])

  return NextResponse.json({
    total_trees:       Number(totals.rows[0].total_trees),
    alive_trees:       Number(totals.rows[0].alive_trees),
    dead_trees:        Number(totals.rows[0].dead_trees),
    survival_pct:      Number(totals.rows[0].survival_pct || 0),
    total_projects:    Number(projectCount.rows[0].cnt),
    total_species:     Number(speciesCount.rows[0].cnt),
    total_expense:     Number(totalExpense.rows[0].total),
    reminders_overdue: Number(overdueReminders.rows[0].cnt),
    reminders_today:   Number(todayReminders.rows[0].cnt),
    recent_trees:      recentTrees.rows,
  })
}
