with open('/tmp/vriksha/lib/db.ts', 'r') as f:
    content = f.read()

old = '''import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})'''

new = '''import { Pool } from 'pg'

// Strip sslmode from URL — newer pg treats sslmode=require as verify-full,
// overriding our rejectUnauthorized:false. Explicit ssl option takes effect
// once sslmode is absent from the connection string.
function stripSslMode(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.delete('sslmode')
    return u.toString()
  } catch {
    return url.replace(/[?&]sslmode=[^&]*/g, \'\').replace(/[?&]$/, \'\')
  }
}

const pool = new Pool({
  connectionString: stripSslMode(
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || \'\'
  ),
  ssl: { rejectUnauthorized: false },
  max: 10,
})'''

content = content.replace(old, new, 1)
with open('/tmp/vriksha/lib/db.ts', 'w') as f:
    f.write(content)
print("Done")
