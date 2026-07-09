const { SignJWT } = require('jose');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-fallback-only-use-for-local-testing-purposes-1234567890');
  
  // Create a mock session token for the owner
  const token = await new SignJWT({ 
    userId: 'mock-owner-id', // We'll need a real owner ID or we can just mock it
    role: 'owner', 
    isOwner: true 
  })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);

  console.log("Token:", token);
}

run();
