import { sql } from '@vercel/postgres'

export { sql }

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
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      gps_boundary TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Species
  await sql`
    CREATE TABLE IF NOT EXISTS species (
      id SERIAL PRIMARY KEY,
      local_name VARCHAR(200) NOT NULL,
      scientific_name VARCHAR(200),
      family VARCHAR(200),
      typical_height_m NUMERIC(6,2),
      care_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Trees
  await sql`
    CREATE TABLE IF NOT EXISTS trees (
      id SERIAL PRIMARY KEY,
      tree_code VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      species_id INTEGER REFERENCES species(id) ON DELETE SET NULL,
      plantation_date DATE,
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      gps_accuracy NUMERIC(8,2),
      address TEXT,
      photo_url TEXT,
      current_height_cm NUMERIC(8,2),
      health_status VARCHAR(20) NOT NULL DEFAULT 'good',
      health_score INTEGER DEFAULT 80,
      created_by VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Owners
  await sql`
    CREATE TABLE IF NOT EXISTS owners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      mobile VARCHAR(20),
      email VARCHAR(120),
      address TEXT,
      whatsapp VARCHAR(20),
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Caretakers
  await sql`
    CREATE TABLE IF NOT EXISTS caretakers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      mobile VARCHAR(20),
      email VARCHAR(120),
      address TEXT,
      whatsapp VARCHAR(20),
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Tree → Owner mapping
  await sql`
    CREATE TABLE IF NOT EXISTS tree_owners (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
      start_date DATE,
      UNIQUE(tree_id, owner_id)
    )
  `

  // Tree → Caretaker mapping
  await sql`
    CREATE TABLE IF NOT EXISTS tree_caretakers (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      caretaker_id INTEGER NOT NULL REFERENCES caretakers(id) ON DELETE CASCADE,
      start_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE(tree_id, caretaker_id)
    )
  `

  // Expenses
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER REFERENCES trees(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      category VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      vendor VARCHAR(200),
      payment_mode VARCHAR(50),
      invoice_url TEXT,
      remarks TEXT,
      created_by VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Maintenance logs
  await sql`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      activity VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      done_by VARCHAR(200),
      photo_url TEXT,
      remarks TEXT,
      next_due_date DATE,
      created_by VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Photos timeline
  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      milestone VARCHAR(50) DEFAULT 'adhoc',
      taken_at TIMESTAMPTZ DEFAULT NOW(),
      notes TEXT,
      created_by VARCHAR(50)
    )
  `

  // Reminders
  await sql`
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL,
      frequency_days INTEGER NOT NULL DEFAULT 3,
      last_sent TIMESTAMPTZ,
      next_due DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Health records
  await sql`
    CREATE TABLE IF NOT EXISTS health_records (
      id SERIAL PRIMARY KEY,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      leaf_color VARCHAR(50),
      height_growth VARCHAR(50),
      stem_condition VARCHAR(50),
      water_available BOOLEAN,
      disease_present BOOLEAN DEFAULT FALSE,
      notes TEXT,
      recorded_by VARCHAR(50),
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Seed default admin if no users
  const { rows } = await sql`SELECT COUNT(*) as cnt FROM users`
  if (Number(rows[0].cnt) === 0) {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('admin123', 10)
    await sql`INSERT INTO users (username, email, password_hash, role) VALUES ('admin','admin@vriksha.com',${hash},'admin')`
  }
}
