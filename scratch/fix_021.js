const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'supabase', 'migrations', '021_secure_security_definer_functions.sql');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const newLines = [];
const pattern = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_."]+)/i;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(pattern);
    if (match) {
        const policyName = match[1];
        const tableName = match[2];
        const dropStmt = `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};`;
        
        if (i > 0 && lines[i-1].includes(dropStmt)) {
            newLines.push(line);
        } else {
            newLines.push(dropStmt);
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log("Fixed 021_secure_security_definer_functions.sql");
