async function test() {
  const res = await fetch('https://esperanca-2026.vercel.app/cidade/gramado');
  const html = await res.text();
  
  // Look for the city ID in the serialized props
  const cityIdGramado = '0bddbcd8-ebb6-4e60-844e-8f05c191b4b1';
  const cityIdNH = '10000000-0000-0000-0000-000000000001';
  
  console.log('Contains Gramado city_id:', html.includes(cityIdGramado));
  console.log('Contains NH city_id:', html.includes(cityIdNH));
  
  // Check if there's a badge showing the city name
  const badgeMatch = html.match(/Gramado/g);
  console.log('Gramado occurrences:', badgeMatch ? badgeMatch.length : 0);
  
  // Also test the API directly as the page would call it
  const apiRes = await fetch('https://esperanca-2026.vercel.app/api/geo/find-church?city_id=' + cityIdGramado + '&neighborhood_text=Centro&campaign_id=30000000-0000-0000-0000-000000000001');
  const apiJson = await apiRes.json();
  console.log('\nAPI test (Gramado + Centro):');
  console.log('  Church:', apiJson.church?.name, '(', apiJson.church?.slug, ')');
  console.log('  City ID:', apiJson.church?.city_id);
  console.log('  Method:', apiJson.method);
  console.log('  Is Gramado church?', apiJson.church?.city_id === cityIdGramado);
}
test();
