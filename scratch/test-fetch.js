async function test() {
  const res = await fetch('https://esperanca-2026.vercel.app/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test User",
      whatsapp: "(51) 99999-9999",
      whatsapp_raw: "51999999999",
      campaign_id: "25e1bb3d-a5ee-4614-bcae-2ba40251767e",
      consent_data: true,
      consent_reminder_whatsapp: false
    })
  });
  console.log('STATUS:', res.status);
  const text = await res.text();
  console.log('BODY:', text);
}
test();
