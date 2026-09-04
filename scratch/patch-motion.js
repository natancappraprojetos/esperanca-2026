const fs = require('fs');
const path = require('path');

const dir = 'src/components/public/funnel';
const files = fs.readdirSync(dir).map(f => path.join(dir, f)).filter(f => f.endsWith('.tsx') && !f.includes('HeroStep'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  // Change initial={{ opacity: 0 ... }} to initial={{ opacity: 1, y: 0 }}
  content = content.replace(/initial=\{\{\s*opacity:\s*0[^}]*\}\}/g, 'initial={{ opacity: 1, y: 0 }}');
  // Change transition to duration: 0 to be completely instant
  content = content.replace(/transition=\{\{[^}]*\}\}/g, 'transition={{ duration: 0 }}');
  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
}
