-- TRIGGERS para log_apache
USE ASO;

CREATE TRIGGER trg_log_apache_insert
AFTER INSERT ON log_apache
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_log_apache (log_apache_id, accion, datos_antes, datos_despues, usuario)
  VALUES (NEW.id, 'INSERT', NULL, CONCAT(
    '{"ip_cliente":"', NEW.ip_cliente,
    '", "fecha":"', DATE_FORMAT(NEW.fecha, '%Y-%m-%d %H:%i:%s'),
    '", "zona_horaria":"', NEW.zona_horaria,
    '", "metodo":"', NEW.metodo,
    '", "recurso":"', NEW.recurso,
    '", "protocolo":"', NEW.protocolo,
    '", "codigo_estado":', NEW.codigo_estado,
    ', "tamano_respuesta":', NEW.tamano_respuesta,
    ', "referer":"', NEW.referer,
    '", "user_agent":"', NEW.user_agent,
    '", "linea_original":"', NEW.linea_original, '"}'
  ), 'system');
END;

CREATE TRIGGER trg_log_apache_update
AFTER UPDATE ON log_apache
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_log_apache (log_apache_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'UPDATE', CONCAT(
    '{"ip_cliente":"', OLD.ip_cliente,
    '", "fecha":"', DATE_FORMAT(OLD.fecha, '%Y-%m-%d %H:%i:%s'),
    '", "zona_horaria":"', OLD.zona_horaria,
    '", "metodo":"', OLD.metodo,
    '", "recurso":"', OLD.recurso,
    '", "protocolo":"', OLD.protocolo,
    '", "codigo_estado":', OLD.codigo_estado,
    ', "tamano_respuesta":', OLD.tamano_respuesta,
    ', "referer":"', OLD.referer,
    '", "user_agent":"', OLD.user_agent,
    '", "linea_original":"', OLD.linea_original, '"}'
  ), CONCAT(
    '{"ip_cliente":"', NEW.ip_cliente,
    '", "fecha":"', DATE_FORMAT(NEW.fecha, '%Y-%m-%d %H:%i:%s'),
    '", "zona_horaria":"', NEW.zona_horaria,
    '", "metodo":"', NEW.metodo,
    '", "recurso":"', NEW.recurso,
    '", "protocolo":"', NEW.protocolo,
    '", "codigo_estado":', NEW.codigo_estado,
    ', "tamano_respuesta":', NEW.tamano_respuesta,
    ', "referer":"', NEW.referer,
    '", "user_agent":"', NEW.user_agent,
    '", "linea_original":"', NEW.linea_original, '"}'
  ), 'system');
END;

CREATE TRIGGER trg_log_apache_delete
AFTER DELETE ON log_apache
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_log_apache (log_apache_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'DELETE', CONCAT(
    '{"ip_cliente":"', OLD.ip_cliente,
    '", "fecha":"', DATE_FORMAT(OLD.fecha, '%Y-%m-%d %H:%i:%s'),
    '", "zona_horaria":"', OLD.zona_horaria,
    '", "metodo":"', OLD.metodo,
    '", "recurso":"', OLD.recurso,
    '", "protocolo":"', OLD.protocolo,
    '", "codigo_estado":', OLD.codigo_estado,
    ', "tamano_respuesta":', OLD.tamano_respuesta,
    ', "referer":"', OLD.referer,
    '", "user_agent":"', OLD.user_agent,
    '", "linea_original":"', OLD.linea_original, '"}'
  ), NULL, 'system');
END;

-- TRIGGERS para log_ftp

CREATE TRIGGER trg_log_ftp_insert
AFTER INSERT ON log_ftp
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_log_ftp (log_ftp_id, accion, datos_antes, datos_despues, usuario)
  VALUES (NEW.id, 'INSERT', NULL, CONCAT(
    '{"fecha":"', IFNULL(DATE_FORMAT(NEW.fecha, '%Y-%m-%d %H:%i:%s'), ''),
    '", "fecha_texto":"', NEW.fecha_texto,
    '", "pid":', NEW.pid,
    ', "accion":"', NEW.accion,
    '", "cliente_ip":"', NEW.cliente_ip,
    '", "usuario":"', IFNULL(NEW.usuario, ''),
    '", "archivo":"', IFNULL(NEW.archivo, ''),
    '", "tamanio":', IFNULL(NEW.tamanio, 0),
    ', "duracion":', IFNULL(NEW.duracion, 0),
    ', "estado":"', IFNULL(NEW.estado, ''),
    '", "linea_original":"', NEW.linea_original, '"}'
  ), 'system');
END;

CREATE TRIGGER trg_log_ftp_update
AFTER UPDATE ON log_ftp
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_log_ftp (log_ftp_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'UPDATE', CONCAT(
    '{"fecha":"', IFNULL(DATE_FORMAT(OLD.fecha, '%Y-%m-%d %H:%i:%s'), ''),
    '", "fecha_texto":"', OLD.fecha_texto,
    '", "pid":', OLD.pid,
    ', "accion":"', OLD.accion,
    '", "cliente_ip":"', OLD.cliente_ip,
    '", "usuario":"', IFNULL(OLD.usuario, ''),
    '", "archivo":"', IFNULL(OLD.archivo, ''),
    '", "tamanio":', IFNULL(OLD.tamanio, 0),
    ', "duracion":', IFNULL(OLD.duracion, 0),
    ', "estado":"', IFNULL(OLD.estado, ''),
    '", "linea_original":"', OLD.linea_original, '"}'
  ), CONCAT(
    '{"fecha":"', IFNULL(DATE_FORMAT(NEW.fecha, '%Y-%m-%d %H:%i:%s'), ''),
    '", "fecha_texto":"', NEW.fecha_texto,
    '", "pid":', NEW.pid,
    ', "accion":"', NEW.accion,
    '", "cliente_ip":"', NEW.cliente_ip,
    '", "usuario":"', IFNULL(NEW.usuario, ''),
    '", "archivo":"', IFNULL(NEW.archivo, ''),
    '", "tamanio":', IFNULL(NEW.tamanio, 0),
    ', "duracion":', IFNULL(NEW.duracion, 0),
    ', "estado":"', IFNULL(NEW.estado, ''),
    '", "linea_original":"', NEW.linea_original, '"}'
  ), 'system');
END;

CREATE TRIGGER trg_log_ftp_delete
AFTER DELETE ON log_ftp
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_log_ftp (log_ftp_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'DELETE', CONCAT(
    '{"fecha":"', IFNULL(DATE_FORMAT(OLD.fecha, '%Y-%m-%d %H:%i:%s'), ''),
    '", "fecha_texto":"', OLD.fecha_texto,
    '", "pid":', OLD.pid,
    ', "accion":"', OLD.accion,
    '", "cliente_ip":"', OLD.cliente_ip,
    '", "usuario":"', IFNULL(OLD.usuario, ''),
    '", "archivo":"', IFNULL(OLD.archivo, ''),
    '", "tamanio":', IFNULL(OLD.tamanio, 0),
    ', "duracion":', IFNULL(OLD.duracion, 0),
    ', "estado":"', IFNULL(OLD.estado, ''),
    '", "linea_original":"', OLD.linea_original, '"}'
  ), NULL, 'system');
END;