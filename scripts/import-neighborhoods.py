import os
import json
import psycopg2
import argparse
from dotenv import load_dotenv

# Dependências necessárias para rodar este script:
# pip install psycopg2-binary python-dotenv

# Carrega as variáveis de ambiente do .env.local
load_dotenv('.env.local')

def get_db_connection():
    # O Supabase fornece a string de conexão no formato postgresql://...
    # Recomendamos usar a Session pooler string (porta 6543) ou a direta (5432)
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL não encontrada no .env.local")
    
    return psycopg2.connect(db_url)

def import_neighborhoods(geojson_path, city_slug):
    """
    Importa bairros de um arquivo GeoJSON para uma cidade específica.
    O GeoJSON deve ter propriedades como 'name' (ou 'NOME') e geometria Polygon/MultiPolygon.
    """
    print(f"Iniciando importação de {geojson_path} para a cidade {city_slug}...")
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'features' not in data:
        raise ValueError("GeoJSON inválido: chave 'features' não encontrada.")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Encontra a cidade no banco
        cur.execute("SELECT id FROM cities WHERE slug = %s", (city_slug,))
        city_record = cur.fetchone()
        
        if not city_record:
            print(f"Erro: Cidade com slug '{city_slug}' não encontrada no banco.")
            return
            
        city_id = city_record[0]
        
        # 2. Insere os bairros
        count = 0
        for feature in data['features']:
            props = feature['properties']
            geom = feature['geometry']
            
            # Tenta pegar o nome de campos comuns de IBGE ou prefeituras
            bairro_nome = props.get('name') or props.get('NOME') or props.get('NM_BAIRRO') or props.get('bairro')
            
            if not bairro_nome:
                print("Aviso: Feature sem nome ignorada.")
                continue

            # Serializa a geometria para GeoJSON string para que o PostGIS entenda usando ST_GeomFromGeoJSON
            geom_json = json.dumps(geom)
            
            # Calcula um ponto central simples para a latitude/longitude
            # O ideal é usar Shapely/GeoPandas para centroid, mas para não exigir dependências pesadas, deixamos o banco calcular
            
            # Insere no banco com Upsert (evita duplicação)
            insert_query = """
                INSERT INTO neighborhoods (city_id, name, slug, status, polygon)
                VALUES (
                    %s, 
                    %s, 
                    %s, 
                    'active',
                    ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)
                )
                ON CONFLICT (city_id, slug) 
                DO UPDATE SET 
                    polygon = EXCLUDED.polygon,
                    name = EXCLUDED.name
                RETURNING id;
            """
            
            # Cria um slug simples
            bairro_slug = bairro_nome.lower().replace(' ', '-').replace('ã', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ç', 'c')
            
            cur.execute(insert_query, (city_id, bairro_nome, bairro_slug, geom_json))
            bairro_id = cur.fetchone()[0]
            
            # Atualiza o centro (latitude/longitude) usando o centróide do polígono calculado pelo PostGIS
            update_center_query = """
                UPDATE neighborhoods 
                SET 
                    latitude = ST_Y(ST_Centroid(polygon)),
                    longitude = ST_X(ST_Centroid(polygon))
                WHERE id = %s;
            """
            cur.execute(update_center_query, (bairro_id,))
            
            count += 1
            
        conn.commit()
        print(f"Sucesso! {count} bairros importados/atualizados para {city_slug}.")

    except Exception as e:
        conn.rollback()
        print(f"Erro durante importação: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Importa polígonos de bairros (GeoJSON) para o PostGIS do Supabase.')
    parser.add_argument('--file', type=str, required=True, help='Caminho para o arquivo GeoJSON')
    parser.add_argument('--city-slug', type=str, required=True, help='Slug da cidade no banco (ex: novo-hamburgo)')
    
    args = parser.parse_args()
    
    if not os.path.exists('.env.local'):
        print("Aviso: Arquivo .env.local não encontrado. O script tentará usar as variáveis de ambiente do sistema.")
        
    import_neighborhoods(args.file, args.city_slug)
