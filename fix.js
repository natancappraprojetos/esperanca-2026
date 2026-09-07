const fs = require('fs');

const files = [
  'src/app/page.tsx',
  'src/app/igreja/[slug]/page.tsx',
  'src/app/cidade/[slug]/page.tsx',
  'src/app/campanha/[slug]/page.tsx',
  'src/app/admin/cidades/page.tsx',
  'src/app/admin/igrejas/page.tsx',
  'src/app/admin/leads/page.tsx',
  'src/components/admin/ChurchesClient.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /eq\('status',\s*'active'\)\s*\n\s*\.single\(\)/g,
      "eq('status', 'active')\n    .order('created_at', { ascending: false })\n    .limit(1)\n    .maybeSingle()"
    );
    fs.writeFileSync(file, content);
  }
}
console.log('Replaced .single() successfully!');
