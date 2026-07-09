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

const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error("Could not parse project reference from Supabase URL:", supabaseUrl);
  process.exit(1);
}
const projectRef = match[1];
const username = `postgres.${projectRef}`;

const regions = [
  'eu-central-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ca-central-1', 'sa-east-1'
];

const passwords = [
  'OKTAY_MASTER_2024_BOOMKIT_SECURE',
  'OKTAY2024BOOMKIT'
];

async function runCheck() {
  let connectedClient = null;

  const directHosts = [
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres', family: 6 },
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: username, family: 6 },
    { host: '2600:1f18:2e13:9d19:aabc:8f0d:c1bb:8fbd', port: 5432, user: 'postgres' },
    { host: '2600:1f18:2e13:9d19:aabc:8f0d:c1bb:8fbd', port: 5432, user: username }
  ];
  
  for (const target of directHosts) {
    for (const password of passwords) {
      const client = new Client({
        host: target.host, port: target.port, user: target.user,
        password: password, database: 'postgres',
        ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000,
        family: target.family
      });
      try {
        await client.connect();
        connectedClient = client;
        break;
      } catch (err) {}
    }
    if (connectedClient) break;
  }
  
  if (!connectedClient) {
    const ports = [6543, 5432];
    for (const region of regions) {
      const host = `aws-0-${region}.pooler.supabase.com`;
      for (const port of ports) {
        for (const password of passwords) {
          const client = new Client({
            host: host, port: port, user: username, password: password,
            database: 'postgres', ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 4000
          });
          try {
            await client.connect();
            connectedClient = client;
            break;
          } catch (err) {}
        }
        if (connectedClient) break;
      }
      if (connectedClient) break;
    }
  }

  if (!connectedClient) {
    console.error("Failed to connect");
    process.exit(1);
  }

  try {
    const resRLS = await connectedClient.query(`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE relname = 'users';
    `);
    console.log("RLS enabled for users:", resRLS.rows[0]?.relrowsecurity);

    const resPol = await connectedClient.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'users';
    `);
    console.log("Policies on users:");
    console.table(resPol.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connectedClient.end();
  }
}

runCheck();
