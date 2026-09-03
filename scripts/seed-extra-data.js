const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const data = [
  { preacher: 'Charlles Britis', distrital: 'Pr. Edlei Pereira', phone: '51 98328-0028', region: 1 },
  { preacher: 'Fábio Correa', distrital: 'Pr. Rafael Nobre', phone: '51 99413-9181', region: 1 },
  { preacher: 'Aryel Marques', distrital: 'Pr. Rodrigo Costa', phone: '51 98126-3945', region: 1 },
  { preacher: 'Elieser Vargas', distrital: 'Pr. Leonir Rellinger', phone: '51 8106-8716', region: 1 },
  { preacher: 'Fábio Motta', distrital: 'Pr. Arizoli Mendes', phone: '51 98455-1890', region: 1 },
  { preacher: 'Juan Vargas', distrital: 'Pr. Marcelo Fragoso', phone: '51 98111-9081', region: 1 },
  { preacher: 'Williams César', distrital: 'Pr. Elton Andrade', phone: '51 98178-0159', region: 1 },
  { preacher: 'Lucilene Britis', distrital: 'Pr. Anderson Teles', phone: '51 98126-0449', region: 1 },
  { preacher: 'Suzete Águas', distrital: 'Pr. Robson Gomes', phone: '51 99879-7015', region: 1 },
  { preacher: 'Harry Streithordt', distrital: 'Pr. Marcio Mutz', phone: '51 98138-1772', region: 2 },
  { preacher: 'Régis Reis', distrital: 'Pr. Wagner Oliveira', phone: '51 99189-0087', region: 2 }, // PDF says Regis Reis, DB has Régis Reis
  { preacher: 'Gustavo Marques', distrital: 'Pr. Rafael Stelle', phone: '51 98298-1345', region: 2 },
  { preacher: 'Otávio Barreto', distrital: 'Pr. João Mensor', phone: '51 99888-6500', region: 2 },
  { preacher: 'Pablo Moleros', distrital: 'Pr. Natan Gomes', phone: '55 99960-8716', region: 3 },
  { preacher: 'Marcelo Nascimento', distrital: 'Pr. Diego dos Santos', phone: '51 8455-1945', region: 3 },
  { preacher: 'Harryson Reis', distrital: 'Pr. Adilson Barros', phone: '51 8262-1864', region: 3 },
  { preacher: 'Ismaile Barragan', distrital: 'Pr. Natalino', phone: '51 98103-0691', region: 3 },
  { preacher: 'Douglas Menslin', distrital: 'Pr. Mauro Santos', phone: '51 98178-0002', region: 3 },
]

async function seedMissingData() {
  console.log('Fetching pastors to map to churches...')
  const { data: pastors, error: pastorsError } = await supabase.from('pastors').select('id, full_name, church_id')
  if (pastorsError) throw pastorsError

  let updatedCount = 0

  for (const item of data) {
    // Match preacher (ignoring exact prefix like "Pr." or "Prof.")
    const pastor = pastors.find(p => p.full_name.includes(item.preacher))
    
    if (pastor) {
      console.log(`Found pastor ${pastor.full_name}, updating church_id: ${pastor.church_id}`)
      
      // Update church
      const { error: churchError } = await supabase
        .from('churches')
        .update({ 
          district_pastor: item.distrital,
          region: item.region,
          phone: item.phone // Assigning the contact phone to the church itself for easier query
        })
        .eq('id', pastor.church_id)

      if (churchError) {
        console.error(`Error updating church for ${item.preacher}:`, churchError)
      } else {
        // Also update the pastor's phone just in case
        await supabase.from('pastors').update({ phone: item.phone }).eq('id', pastor.id)
        updatedCount++
      }
    } else {
      console.log(`⚠️ Pastor not found for: ${item.preacher}`)
    }
  }

  console.log(`Finished updating ${updatedCount} churches!`)
}

seedMissingData()
