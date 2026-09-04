const fs = require('fs');
const path = require('path');

const dir = 'src/components/public/funnel';
const files = fs.readdirSync(dir).map(f => path.join(dir, f)).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Remove framer-motion import if unused later, but for now just replace tags
  content = content.replace(/<motion\.div[^>]*>/g, match => {
    // We need to keep the className and style if they exist, but remove initial, animate, transition
    return match
      .replace(/<motion\.div/g, '<div')
      .replace(/\s*initial=\{[^}]*\}\}/g, '')
      .replace(/\s*animate=\{[^}]*\}\}/g, '')
      .replace(/\s*transition=\{[^}]*\}\}/g, '');
  });
  content = content.replace(/<\/motion\.div>/g, '</div>');
  
  fs.writeFileSync(file, content);
  console.log(`Removed motion from ${file}`);
}
