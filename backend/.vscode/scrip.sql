USE ASO;

-- Corrige nombres si prefieres mantener los originales de Node.js
RENAME TABLE log_apache TO apache_logs, log_ftp TO ftp_logs;

-- O actualiza los triggers para los nuevos nombres
ALTER TABLE bitacora_log_apache 
  CHANGE COLUMN log_apache_id apache_logs_id INT;

ALTER TABLE bitacora_log_ftp 
  CHANGE COLUMN log_ftp_id ftp_logs_id INT;

  GRANT ALL PRIVILEGES ON ASO.* TO 'alejandro'@'localhost';
FLUSH PRIVILEGES;