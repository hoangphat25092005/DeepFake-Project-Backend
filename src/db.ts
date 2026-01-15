import * as dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const caPath = path.join(__dirname, '..', 'ca.pem');

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: [fs.readFileSync(caPath, 'utf-8')],
  },
});

export default pool;

// Quick test (uncomment to verify connection)
// pool.query('SELECT version()', (err, res) => {
//   if (err) console.error('Connection failed', err);
//   else console.log('Connected to:', res.rows[0].version);
// });