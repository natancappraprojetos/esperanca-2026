import os
import json
import geopandas as gpd
import unicodedata

def normalize_text(text):
    if not text:
        return ''
    text = str(text).lower()
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    return text.strip().replace("'", "''")

def create_slug(text):
    return normalize_text(text).replace(' ', '-')

def run_import():
    print("Reading shapefile (this may take a minute)...")
    shp_path = 'IBGE/ibge_extracted_1/ibge_2022_bairros_set_censitarios.shp'
    gdf = gpd.read_file(shp_path)
    
    gdf_rs = gdf[gdf['sigla_uf'] == 'RS']
    
    unique_cities = gdf_rs[['cd_mun', 'nm_mun']].drop_duplicates()
    
    if gdf_rs.crs and gdf_rs.crs.to_epsg() != 4326:
        gdf_rs = gdf_rs.to_crs(epsg=4326)

    out_file = 'supabase/migrations/012_ibge_data.sql'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("-- Migration: 012_ibge_data.sql\n")
        f.write("-- IBGE Cities and Neighborhoods for RS\n")
        f.write("BEGIN;\n\n")
        
        f.write("DO $$\n")
        f.write("DECLARE\n")
        f.write("  v_rs_id UUID;\n")
        f.write("BEGIN\n")
        f.write("  SELECT id INTO v_rs_id FROM states WHERE uf = 'RS' LIMIT 1;\n\n")

        # Create cities with DO block logic to get their IDs
        for _, row in unique_cities.iterrows():
            cd_mun = str(row['cd_mun'])
            nm_mun = str(row['nm_mun']).replace("'", "''")
            slug = create_slug(nm_mun)
            f.write(f"  INSERT INTO cities (state_id, name, slug, ibge_code, status)\n")
            f.write(f"  VALUES (v_rs_id, '{nm_mun}', '{slug}', {cd_mun}, 'active')\n")
            f.write(f"  ON CONFLICT (slug, state_id) DO UPDATE SET ibge_code = EXCLUDED.ibge_code;\n\n")
            
        f.write("END $$;\n\n")
        
        # Now neighborhoods
        print("Processing neighborhoods...")
        f.write("DO $$\n")
        f.write("DECLARE\n")
        f.write("  v_city_id UUID;\n")
        f.write("BEGIN\n")
        
        last_cd_mun = None
        for i, row in gdf_rs.iterrows():
            cd_mun = str(row['cd_mun'])
            if cd_mun != last_cd_mun:
                f.write(f"  SELECT id INTO v_city_id FROM cities WHERE ibge_code = {cd_mun} LIMIT 1;\n")
                last_cd_mun = cd_mun
                
            nm_bairro = str(row['nm_bairro']).replace("'", "''")
            name_normalized = normalize_text(nm_bairro)
            
            geom_wkt = row['geometry'].wkt if row['geometry'] else None
            if not geom_wkt:
                continue
                
            f.write(f"  INSERT INTO neighborhoods (city_id, name, name_normalized, geometry, centroid, latitude, longitude, source, status)\n")
            f.write(f"  VALUES (\n")
            f.write(f"    v_city_id, '{nm_bairro}', '{name_normalized}',\n")
            f.write(f"    ST_Multi(ST_GeomFromText('{geom_wkt}', 4326)),\n")
            f.write(f"    ST_Centroid(ST_GeomFromText('{geom_wkt}', 4326)),\n")
            f.write(f"    ST_Y(ST_Centroid(ST_GeomFromText('{geom_wkt}', 4326))),\n")
            f.write(f"    ST_X(ST_Centroid(ST_GeomFromText('{geom_wkt}', 4326))),\n")
            f.write(f"    'ibge_2022', 'active'\n")
            f.write(f"  );\n")
            
        f.write("END $$;\n\n")
        f.write("COMMIT;\n")
        
    print(f"Generated {out_file} successfully.")

if __name__ == '__main__':
    run_import()
