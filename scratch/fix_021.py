import re
import sys

file_path = r'c:\Users\oktay\Desktop\boomkit-1\supabase\migrations\021_secure_security_definer_functions.sql'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_."]+)', re.IGNORECASE)

lines = content.split('\n')
new_lines = []
for i, line in enumerate(lines):
    match = pattern.search(line)
    if match:
        policy_name = match.group(1)
        table_name = match.group(2)
        drop_stmt = f'DROP POLICY IF EXISTS "{policy_name}" ON {table_name};'
        
        if i > 0 and drop_stmt in lines[i-1]:
            new_lines.append(line)
        else:
            new_lines.append(drop_stmt)
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Fixed 021_secure_security_definer_functions.sql")
