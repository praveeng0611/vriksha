import { Pool } from 'pg'

// Strip sslmode from URL — newer pg treats sslmode=require as verify-full,
// overriding our rejectUnauthorized:false. Explicit ssl option takes effect
// once sslmode is absent from the connection string.
function stripSslMode(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.delete('sslmode')
    return u.toString()
  } catch {
    return url.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '')
  }
}

const pool = new Pool({
  connectionString: stripSslMode(
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || ''
  ),
  ssl: { rejectUnauthorized: false },
  max: 10,
})

// Drop-in replacement for @vercel/postgres sql tag
export async function sql<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  let query = ''
  const params: any[] = []
  strings.forEach((str, i) => {
    query += str
    if (i < values.length) {
      params.push(values[i])
      query += `$${params.length}`
    }
  })
  const result = await pool.query<T>(query, params)
  return result
}

export async function initDB() {
  // Users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(120),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'volunteer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Projects
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      plantation_date DATE,
      state VARCHAR(100),
      district VARCHAR(100),
      village VARCHAR(100),
      sponsor VARCHAR(200),
      budget NUMERIC(12,2),
      target_trees INTEGER,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Species
  await sql`
    CREATE TABLE IF NOT EXISTS species (
      id SERIAL PRIMARY KEY,
      common_name VARCHAR(200) NOT NULL,
      scientific_name VARCHAR(200),
      family VARCHAR(200),
      native_region TEXT,
      avg_height_m NUMERIC(6,2),
      notes TEXT
    )
  `

  // Trees
  await sql`
    CREATE TABLE IF NOT EXISTS trees (
      id SERIAL PRIMARY KEY,
      tree_code VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      species_id INTEGER REFERENCES species(id) ON DELETE SET NULL,
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      planted_date DATE,
      health_status VARCHAR(20) DEFAULT 'good',
      height_cm INTEGER,
      girth_cm INTEGER,
      notes TEXT,
      qr_code TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Owners
  await sql`
    CREATE TABLE IF NOT EXISTS owners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      phone VARCHAR(30),
      email VARCHAR(120),
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Caretakers
  await sql`
    CREATE TABLE IF NOT EXISTS caretakers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      phone VARCHAR(30),
      email VARCHAR(120),
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Tree-Owner junction
  await sql`
    CREATE TABLE IF NOT EXISTS tree_owners (
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
      since DATE,
      PRIMARY KEY (tree_id, owner_id)
    )
  `

  // Tree-Caretaker junction
  await sql`
    CREATE TABLE IF NOT EXISTS tree_caretakers (
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      caretaker_id INTEGER REFERENCES caretakers(id) ON DELETE CASCADE,
      since DATE,
      PRIMARY KEY (tree_id, caretaker_id)
    )
  `

  // Expenses
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      category VARCHAR(50),
      amount NUMERIC(10,2) NOT NULL,
      description TEXT,
      expense_date DATE NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Maintenance Logs
  await sql`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      activity VARCHAR(50) NOT NULL,
      performed_by VARCHAR(200),
      performed_date DATE NOT NULL,
      notes TEXT,
      next_due_date DATE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Photos
  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      caption TEXT,
      taken_at DATE,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Reminders
  await sql`
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      reminder_type VARCHAR(50),
      frequency_days INTEGER DEFAULT 30,
      next_due DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Health Records
  await sql`
    CREATE TABLE IF NOT EXISTS health_records (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
      health_status VARCHAR(20) NOT NULL,
      recorded_date DATE NOT NULL,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Seed default admin if no users exist
  const { rows } = await sql`SELECT COUNT(*) as cnt FROM users`
  if (parseInt((rows[0] as any).cnt) === 0) {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('admin123', 10)
    await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@vriksha.app', ${hash}, 'admin')
    `
  }
}
