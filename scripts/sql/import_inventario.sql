TRUNCATE TABLE "Inventario" CASCADE;
\COPY "Inventario" FROM 'temp_inventario.csv' WITH CSV HEADER;