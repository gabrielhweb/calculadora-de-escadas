CREATE TABLE IF NOT EXISTS controle_cotas_apis (
    mes_ano VARCHAR(7) PRIMARY KEY,
    uso_google INT NOT NULL DEFAULT 0,
    uso_mapbox INT NOT NULL DEFAULT 0
);
