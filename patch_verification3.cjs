const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/verification/page.tsx', 'utf8');

const regex = /{editSpace\.details && Object\.keys\(editSpace\.details\)\.length > 0 && \([\s\S]*?<\/div>\s*\)}/;
content = content.replace(regex, '');

fs.writeFileSync('src/app/dashboard/verification/page.tsx', content);
