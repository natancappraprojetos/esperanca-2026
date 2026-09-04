import geopandas as gpd

gdf = gpd.read_file('IBGE/ibge_extracted_1/ibge_2022_bairros_set_censitarios.shp')
print(gdf.columns)
print(gdf.head(3))
