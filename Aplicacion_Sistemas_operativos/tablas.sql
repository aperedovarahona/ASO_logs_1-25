-- Crear base de datos y usarla
CREATE DATABASE IF NOT EXISTS ASO;
USE ASO;

-- DROP DATABASE ASO; -- Descomenta si quieres eliminar la base antes

-- TABLA log_apache
CREATE TABLE log_apache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_cliente VARCHAR(45),
    fecha DATETIME,
    zona_horaria VARCHAR(10),
    metodo VARCHAR(10),
    recurso TEXT,
    protocolo VARCHAR(20),
    codigo_estado INT,
    tamano_respuesta INT,
    referer TEXT,
    user_agent TEXT,
    linea_original TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA log_ftp
CREATE TABLE log_ftp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NULL,
    fecha_texto VARCHAR(50),
    pid INT,
    accion VARCHAR(50),
    cliente_ip VARCHAR(45),
    usuario VARCHAR(100) DEFAULT NULL,
    archivo TEXT DEFAULT NULL,
    tamanio INT DEFAULT NULL,
    duracion FLOAT DEFAULT NULL,
    estado VARCHAR(100) DEFAULT NULL,
    linea_original TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLAS DE BITÁCORA
CREATE TABLE bitacora_log_apache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_apache_id INT NOT NULL,
    accion VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    datos_antes TEXT NULL,
    datos_despues TEXT NULL,
    usuario VARCHAR(100) NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bitacora_log_ftp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_ftp_id INT NOT NULL,
    accion VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    datos_antes TEXT NULL,
    datos_despues TEXT NULL,
    usuario VARCHAR(100) NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLAS DE ALERTAS
CREATE TABLE alerta_log_apache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_apache_id INT NOT NULL,
    tipo_alerta VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerta_log_ftp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_ftp_id INT NOT NULL,
    tipo_alerta VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLAS DE REPORTES
CREATE TABLE reporte_log_apache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    resumen TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reporte_log_ftp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    resumen TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES para log_apache
CREATE INDEX idx_fecha_apache ON log_apache(fecha);
CREATE INDEX idx_ip_apache ON log_apache(ip_cliente);
CREATE INDEX idx_metodo_apache ON log_apache(metodo);

-- ÍNDICES para log_ftp
CREATE INDEX idx_fecha_ftp ON log_ftp(fecha);
CREATE INDEX idx_pid_ftp ON log_ftp(pid);
CREATE INDEX idx_accion_ftp ON log_ftp(accion);

-- ÍNDICES para bitácoras
CREATE INDEX idx_bitacora_log_apache_log_id ON bitacora_log_apache(log_apache_id);
CREATE INDEX idx_bitacora_log_ftp_log_id ON bitacora_log_ftp(log_ftp_id);

-- ÍNDICES para alertas
CREATE INDEX idx_alerta_log_apache_log_id ON alerta_log_apache(log_apache_id);
CREATE INDEX idx_alerta_log_ftp_log_id ON alerta_log_ftp(log_ftp_id);

-- ÍNDICES para reportes (por fecha)
CREATE INDEX idx_reporte_log_apache_fecha ON reporte_log_apache(fecha_inicio, fecha_fin);
CREATE INDEX idx_reporte_log_ftp_fecha ON reporte_log_ftp(fecha_inicio, fecha_fin);

-- LLAVES FORÁNEAS para bitácoras y alertas
ALTER TABLE bitacora_log_apache
ADD CONSTRAINT fk_bitacora_log_apache_log FOREIGN KEY (log_apache_id) REFERENCES log_apache(id) ON DELETE CASCADE;

ALTER TABLE bitacora_log_ftp
ADD CONSTRAINT fk_bitacora_log_ftp_log FOREIGN KEY (log_ftp_id) REFERENCES log_ftp(id) ON DELETE CASCADE;

ALTER TABLE alerta_log_apache
ADD CONSTRAINT fk_alerta_log_apache_log FOREIGN KEY (log_apache_id) REFERENCES log_apache(id) ON DELETE CASCADE;

ALTER TABLE alerta_log_ftp
ADD CONSTRAINT fk_alerta_log_ftp_log FOREIGN KEY (log_ftp_id) REFERENCES log_ftp(id) ON DELETE CASCADE;
