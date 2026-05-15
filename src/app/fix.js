const fs = require('fs');
const content = fs.readFileSync('src/app/App.tsx', 'utf8');
const fixed = content.split('\n').map(line => line.replace(/^[0-9]+: /, '')).join('\n');
fs.writeFileSync('src/app/App.tsx', fixed);