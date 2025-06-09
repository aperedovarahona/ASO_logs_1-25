-- TRIGGERS para alertas
SHOW TABLES IN ASO;

CREATE TRIGGER trg_alertas_insert
AFTER INSERT ON alertas
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_alertas (alerta_id, accion, datos_antes, datos_despues, usuario)
  VALUES (NEW.id, 'INSERT', NULL, CONCAT(
    '{"tipo":"', NEW.tipo,
    '", "mensaje":"', NEW.mensaje,
    '", "fecha_creacion":"', DATE_FORMAT(NEW.fecha_creacion, '%Y-%m-%d %H:%i:%s'),
    '", "estado":"', NEW.estado,
    '", "detalle":"', IFNULL(NEW.detalle, ''),
    '"}'
  ), 'system');
END;

CREATE TRIGGER trg_alertas_update
AFTER UPDATE ON alertas
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_alertas (alerta_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'UPDATE', CONCAT(
    '{"tipo":"', OLD.tipo,
    '", "mensaje":"', OLD.mensaje,
    '", "fecha_creacion":"', DATE_FORMAT(OLD.fecha_creacion, '%Y-%m-%d %H:%i:%s'),
    '", "estado":"', OLD.estado,
    '", "detalle":"', IFNULL(OLD.detalle, ''),
    '"}'
  ), CONCAT(
    '{"tipo":"', NEW.tipo,
    '", "mensaje":"', NEW.mensaje,
    '", "fecha_creacion":"', DATE_FORMAT(NEW.fecha_creacion, '%Y-%m-%d %H:%i:%s'),
    '", "estado":"', NEW.estado,
    '", "detalle":"', IFNULL(NEW.detalle, ''),
    '"}'
  ), 'system');
END;

CREATE TRIGGER trg_alertas_delete
AFTER DELETE ON alertas
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_alertas (alerta_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'DELETE', CONCAT(
    '{"tipo":"', OLD.tipo,
    '", "mensaje":"', OLD.mensaje,
    '", "fecha_creacion":"', DATE_FORMAT(OLD.fecha_creacion, '%Y-%m-%d %H:%i:%s'),
    '", "estado":"', OLD.estado,
    '", "detalle":"', IFNULL(OLD.detalle, ''),
    '"}'
  ), NULL, 'system');
END;

-- TRIGGERS para reportes

CREATE TRIGGER trg_reportes_insert
AFTER INSERT ON reportes
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_reportes (reporte_id, accion, datos_antes, datos_despues, usuario)
  VALUES (NEW.id, 'INSERT', NULL, CONCAT(
    '{"titulo":"', NEW.titulo,
    '", "descripcion":"', NEW.descripcion,
    '", "fecha_reporte":"', DATE_FORMAT(NEW.fecha_reporte, '%Y-%m-%d %H:%i:%s'),
    '", "autor":"', NEW.autor,
    '", "estado":"', NEW.estado,
    '", "detalle":"', IFNULL(NEW.detalle, ''),
    '"}'
  ), 'system');
END;

CREATE TRIGGER trg_reportes_update
AFTER UPDATE ON reportes
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_reportes (reporte_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'UPDATE', CONCAT(
    '{"titulo":"', OLD.titulo,
    '", "descripcion":"', OLD.descripcion,
    '", "fecha_reporte":"', DATE_FORMAT(OLD.fecha_reporte, '%Y-%m-%d %H:%i:%s'),
    '", "autor":"', OLD.autor,
    '", "estado":"', OLD.estado,
    '", "detalle":"', IFNULL(OLD.detalle, ''),
    '"}'
  ), CONCAT(
    '{"titulo":"', NEW.titulo,
    '", "descripcion":"', NEW.descripcion,
    '", "fecha_reporte":"', DATE_FORMAT(NEW.fecha_reporte, '%Y-%m-%d %H:%i:%s'),
    '", "autor":"', NEW.autor,
    '", "estado":"', NEW.estado,
    '", "detalle":"', IFNULL(NEW.detalle, ''),
    '"}'
  ), 'system');
END;

CREATE TRIGGER trg_reportes_delete
AFTER DELETE ON reportes
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_reportes (reporte_id, accion, datos_antes, datos_despues, usuario)
  VALUES (OLD.id, 'DELETE', CONCAT(
    '{"titulo":"', OLD.titulo,
    '", "descripcion":"', OLD.descripcion,
    '", "fecha_reporte":"', DATE_FORMAT(OLD.fecha_reporte, '%Y-%m-%d %H:%i:%s'),
    '", "autor":"', OLD.autor,
    '", "estado":"', OLD.estado,
    '", "detalle":"', IFNULL(OLD.detalle, ''),
    '"}'
  ), NULL, 'system');
END;

