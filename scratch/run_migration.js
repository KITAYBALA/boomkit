const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in env!");
  process.exit(1);
}

// Extract project reference from Supabase URL: e.g. https://rwlqlavtrrdferkbgleb.supabase.co -> rwlqlavtrrdferkbgleb
const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error("Could not parse project reference from Supabase URL:", supabaseUrl);
  process.exit(1);
}
const projectRef = match[1];
const username = `postgres.${projectRef}`;

const regions = [
  'eu-central-1', // Frankfurt (very common for European users)
  'us-east-1',    // N. Virginia
  'us-east-2',    // Ohio
  'us-west-1',    // N. California
  'us-west-2',    // Oregon
  'eu-west-1',    // Ireland
  'eu-west-2',    // London
  'eu-west-3',    // Paris
  'ap-southeast-1', // Singapore
  'ap-southeast-2', // Sydney
  'ap-northeast-1', // Tokyo
  'ap-northeast-2', // Seoul
  'ap-south-1',     // Mumbai
  'ca-central-1',   // Canada
  'sa-east-1'       // São Paulo
];

const passwords = [
  'OKTAY_MASTER_2024_BOOMKIT_SECURE',
  'OKTAY2024BOOMKIT'
];

async function runMigration() {
  const sqlPath = path.resolve(__dirname, '../supabase/migrations/021_secure_security_definer_functions.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error("Migration file not found at:", sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log("Migration SQL loaded successfully.");

  let connectedClient = null;

  // Try direct connection first
  const directHosts = [
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres', family: 6 },
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: username, family: 6 },
    { host: '2600:1f18:2e13:9d19:aabc:8f0d:c1bb:8fbd', port: 5432, user: 'postgres' },
    { host: '2600:1f18:2e13:9d19:aabc:8f0d:c1bb:8fbd', port: 5432, user: username }
  ];
  
  for (const target of directHosts) {
    for (const password of passwords) {
      console.log(`Trying direct host ${target.host} on port ${target.port} with user ${target.user}...`);
      const client = new Client({
        host: target.host,
        port: target.port,
        user: target.user,
        password: password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
        family: target.family
      });
      try {
        await client.connect();
        console.log(`\nConnection SUCCESSFUL on direct host!`);
        connectedClient = client;
        break;
      } catch (err) {
        console.log(`  Failed: ${err.message}`);
      }
    }
    if (connectedClient) break;
  }
  
  if (!connectedClient) {
    // Outer loop through regions, inner loop through passwords, and ports
    const ports = [6543, 5432];
    for (const region of regions) {
      const host = `aws-0-${region}.pooler.supabase.com`;
      for (const port of ports) {
        for (const password of passwords) {
          console.log(`Trying ${region} pooler on port ${port} with password: ${password.substring(0, 4)}...`);
          const client = new Client({
            host: host,
            port: port,
            user: username,
            password: password,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 4000 // 4 seconds timeout
          });

          try {
            await client.connect();
            console.log(`\nConnection SUCCESSFUL on region: ${region} port: ${port} with password: ${password.substring(0, 4)}...`);
            connectedClient = client;
            break;
          } catch (err) {
            // Log brief error to avoid clutter
            console.log(`  Failed: ${err.message}`);
          }
        }
        if (connectedClient) break;
      }
      if (connectedClient) break;
    }
  }

  if (!connectedClient) {
    console.error("\nFailed to connect to the database with any region/password combination.");
    process.exit(1);
  }

  try {
    console.log("Executing migration SQL...");
    await connectedClient.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Error executing migration:", err.message || err);
  } finally {
    await connectedClient.end();
  }
}

runMigration();
