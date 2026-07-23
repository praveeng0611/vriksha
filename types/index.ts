export type Role = 'admin' | 'volunteer' | 'caretaker' | 'viewer'
export type HealthStatus = 'excellent' | 'good' | 'average' | 'poor' | 'dead'
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold'
export type ReminderStatus = 'pending' | 'completed' | 'skipped' | 'overdue'
export type MaintenanceActivity =
  | 'watering' | 'fertilizer' | 'weeding' | 'pruning'
  | 'trimming' | 'mulching' | 'pest_control' | 'tree_guard_repair' | 'inspection'
export type ExpenseCategory =
  | 'plant' | 'transport' | 'pit_digging' | 'labour'
  | 'water' | 'fertilizer' | 'tree_guard' | 'maintenance' | 'miscellaneous'

export interface User {
  id: number
  username: string
  email: string | null
  role: Role
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  plantation_date: string | null
  state: string | null
  district: string | null
  village: string | null
  sponsor: string | null
  budget: number | null
  target_trees: number | null
  status: ProjectStatus
  created_at: string
  tree_count?: number
}

export interface Species {
  id: number
  local_name: string
  scientific_name: string | null
  family: string | null
  typical_height_m: number | null
  care_notes: string | null
}

export interface Tree {
  id: number
  tree_code: string
  project_id: number | null
  project_name?: string
  species_id: number | null
  species_local?: string
  species_scientific?: string
  plantation_date: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  photo_url: string | null
  current_height_cm: number | null
  health_status: HealthStatus
  health_score: number | null
  created_by: string | null
  created_at: string
  updated_at: string
  caretaker_name?: string | null
  caretaker_mobile?: string | null
  owner_name?: string | null
}

export interface Owner {
  id: number
  name: string
  mobile: string | null
  email: string | null
  address: string | null
  whatsapp: string | null
  remarks: string | null
  created_at: string
}

export interface Caretaker {
  id: number
  name: string
  mobile: string | null
  email: string | null
  address: string | null
  whatsapp: string | null
  remarks: string | null
  created_at: string
  tree_count?: number
}

export interface Expense {
  id: number
  tree_id: number | null
  project_id: number | null
  tree_code?: string
  project_name?: string
  category: ExpenseCategory
  date: string
  amount: number
  vendor: string | null
  payment_mode: string | null
  invoice_url: string | null
  remarks: string | null
  created_by: string | null
  created_at: string
}

export interface MaintenanceLog {
  id: number
  tree_id: number
  tree_code?: string
  activity: MaintenanceActivity
  date: string
  done_by: string | null
  photo_url: string | null
  remarks: string | null
  next_due_date: string | null
  created_by: string | null
  created_at: string
}

export interface Reminder {
  id: number
  tree_id: number
  tree_code?: string
  activity_type: MaintenanceActivity
  frequency_days: number
  next_due: string
  status: ReminderStatus
  channel: string
  created_at: string
}

export interface DashboardStats {
  total_trees: number
  alive_trees: number
  dead_trees: number
  survival_pct: number
  total_projects: number
  total_species: number
  total_expense: number
  reminders_overdue: number
  reminders_today: number
  recent_trees: Tree[]
}
