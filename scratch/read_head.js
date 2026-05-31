const cp = require('child_process');
const fs = require('fs');

const out = cp.execSync('git show HEAD:app/page.tsx', { maxBuffer: 20 * 1024 * 1024 }).toString();
const idx = out.indexOf('currentPage === "staff"');
if (idx !== -1) {
    console.log(out.substring(idx - 100, idx + 8000));
} else {
    console.log('Not found');
}
