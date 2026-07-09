const fetch = require('node-fetch');
async function run() {
  const res = await fetch('https://rwlqlavtrrdferkbgleb.supabase.co/rest/v1/');
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
}
run();
