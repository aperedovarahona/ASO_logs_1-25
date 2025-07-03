const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

function formatDateToSQL(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + ' ' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0');
}

function parseFTPDate(dateStr) {
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const parts = dateStr.split(' ');
  const month = months[parts[1]];
  const day = parseInt(parts[2]);
  const [hour, minute, second] = parts[3].split(':').map(Number);
  const year = parseInt(parts[4]);
  return new Date(year, month, day, hour, minute, second);
}

function parseApacheDate(dateStr) {
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const [day, mon, yearTime] = dateStr.split('/');
  const [year, hour, min, sec] = yearTime.split(/:| /);
  return new Date(year, months[mon], day, hour, min, sec);
}

const dbConfig = {
  host: 'localhost',
  user: 'jorge',
  password: '4515',
  database: 'ASO',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Función para generar un hash único de cada registro
function generateLogHash(log, type) {
  const hash = crypto.createHash('sha1');
  
  if (type === 'apache') {
    hash.update(`${log.ip_cliente}-${log.fecha}-${log.metodo}-${log.recurso}-${log.codigo_estado}`);
  } else if (type === 'ftp') {
    hash.update(`${log.fecha}-${log.ip_cliente}-${log.usuario}-${log.accion}-${log.archivo}-${log.estado}`);
  }
  
  return hash.digest('hex');
}

async function processLogBatch(connection, logs, type) {
  const stats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  // Generar hashes para todos los logs nuevos
  const logHashes = new Map();
  logs.forEach(log => {
    const hash = generateLogHash(log, type);
    logHashes.set(hash, log);
  });

  // Obtener hashes existentes en la base de datos
  const existingHashes = new Set();
  if (type === 'apache') {
    const [rows] = await connection.query('SELECT id, hash FROM log_apache_hashes');
    rows.forEach(row => existingHashes.add(row.hash));
  } else if (type === 'ftp') {
    const [rows] = await connection.query('SELECT id, hash FROM log_ftp_hashes');
    rows.forEach(row => existingHashes.add(row.hash));
  }

  // Procesar cada log
  for (const [hash, log] of logHashes) {
    try {
      if (existingHashes.has(hash)) {
        stats.skipped++;
        continue;
      }

      // Insertar el nuevo registro
      let tableName, hashTableName;
      if (type === 'apache') {
        tableName = 'log_apache';
        hashTableName = 'log_apache_hashes';
        const [result] = await connection.query('INSERT INTO log_apache SET ?', log);
        await connection.query('INSERT INTO log_apache_hashes (log_id, hash) VALUES (?, ?)', [result.insertId, hash]);
      } else {
        tableName = 'log_ftp';
        hashTableName = 'log_ftp_hashes';
        const [result] = await connection.query('INSERT INTO log_ftp SET ?', log);
        await connection.query('INSERT INTO log_ftp_hashes (log_id, hash) VALUES (?, ?)', [result.insertId, hash]);
      }

      stats.inserted++;
    } catch (err) {
      console.error('Error processing log:', err);
      stats.errors++;
    }
  }

  return stats;
}

async function initializeDB() {
  try {
    const connection = await pool.getConnection();
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await connection.query('TRUNCATE TABLE bitacora_apache');
    await connection.query('TRUNCATE TABLE bitacora_ftp');
    await connection.query('TRUNCATE TABLE log_apache');
    await connection.query('TRUNCATE TABLE log_ftp');
    await connection.query('DROP TABLE IF EXISTS log_apache_hashes');
    await connection.query('DROP TABLE IF EXISTS log_ftp_hashes');
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Crear tablas principales
    await connection.query(`
      CREATE TABLE IF NOT EXISTS log_apache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_cliente VARCHAR(45) NOT NULL,
        fecha DATETIME NOT NULL,
        metodo VARCHAR(10) NOT NULL,
        recurso TEXT NOT NULL,
        codigo_estado INT NOT NULL,
        user_agent TEXT
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS log_ftp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATETIME NOT NULL,
        ip_cliente VARCHAR(45) NOT NULL,
        usuario VARCHAR(50),
        accion VARCHAR(50) NOT NULL,
        archivo TEXT,
        estado VARCHAR(50) NOT NULL,
        bytes BIGINT DEFAULT 0,
        velocidad VARCHAR(50)
      );
    `);

    // Crear tablas para almacenar hashes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS log_apache_hashes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_id INT NOT NULL,
        hash VARCHAR(40) NOT NULL UNIQUE,
        FOREIGN KEY (log_id) REFERENCES log_apache(id) ON DELETE CASCADE
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS log_ftp_hashes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_id INT NOT NULL,
        hash VARCHAR(40) NOT NULL UNIQUE,
        FOREIGN KEY (log_id) REFERENCES log_ftp(id) ON DELETE CASCADE
      );
    `);

    // Tablas de bitácora
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bitacora_apache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_id INT NOT NULL,
        accion VARCHAR(50) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        detalles TEXT,
        FOREIGN KEY (log_id) REFERENCES log_apache(id) ON DELETE CASCADE
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bitacora_ftp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_id INT NOT NULL,
        accion VARCHAR(50) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        detalles TEXT,
        FOREIGN KEY (log_id) REFERENCES log_ftp(id) ON DELETE CASCADE
      );
    `);
    
    connection.release();
    console.log('✅ Base de datos inicializada con sistema anti-duplicados');
  } catch (err) {
    console.error('Error inicializando DB:', err);
    process.exit(1);
  }
}

initializeDB();

function parseFTPDate(dateStr) {
  // Normaliza espacios múltiples a uno solo
  dateStr = dateStr.replace(/\s+/g, ' ').trim();
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const parts = dateStr.split(' ');
  const month = months[parts[1]];
  const day = parseInt(parts[2]);
  const [hour, minute, second] = parts[3].split(':').map(Number);
  const year = parseInt(parts[4]);
  return new Date(year, month, day, hour, minute, second);
}


function parseFTPLog(line) {
  // Modificada para capturar el PID
  const regex = /^([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+\[pid\s+(\d+)\]\s+\[([^\]]+)\]\s+FTP\s+(command|response):\s+Client\s+"(::ffff:)??([\d.]+)",\s+"(.*)"$/;
  const match = line.match(regex);

  if (match) {
    // Para debugging, luego puedes comentar estas líneas
    console.log('Matched line:', line);
    console.log('Groups:', match);

    const [, rawDate, pid, usuario, tipo, , ip, contenido] = match;
    const date = parseFTPDate(rawDate);
    if (isNaN(date.getTime())) return null;

    return {
      pid: parseInt(pid), // Añadido el PID
      fecha: formatDateToSQL(date),
      ip_cliente: ip,
      usuario: usuario || null,
      accion: tipo.toLowerCase(),
      archivo: contenido,
      estado: 'info',
      bytes: 0,
      velocidad: null
    };
  } else {
    console.log('No match for line:', line); // Para debug
  }

  return null;
}


app.post('/api/logs/upload', async (req, res) => {
  const { content, type } = req.body;
  if (!content || !type) return res.status(400).json({ error: 'Missing content or type' });

  try {
    const connection = await pool.getConnection();
    const lines = content.split('\n').filter(l => l.trim());
    
    let logs = [];
    if (type === 'apache') {
      const regex = /^(\S+) - - \[(.*?)\] "(\S+) (.*?) HTTP\/[\d.]+" (\d{3}) \d+ "(?:.*?)" "(.*?)"/;
      logs = lines.map(l => {
        const m = l.match(regex);
        if (!m) return null;
        const dt = parseApacheDate(m[2]);
        return {
          ip_cliente: m[1],
          fecha: formatDateToSQL(dt),
          metodo: m[3],
          recurso: m[4],
          codigo_estado: parseInt(m[5]),
          user_agent: m[6] || ''
        };  
      }).filter(Boolean);
    } else if (type === 'ftp') {
      logs = lines.map(parseFTPLog).filter(Boolean);
    } else {
      connection.release();
      return res.status(400).json({ error: 'Invalid log type' });
    }

    if (!logs.length) {
      connection.release();
      return res.status(400).json({ error: 'No valid logs found' });
    }

    const stats = await processLogBatch(connection, logs, type);
    connection.release();

    return res.json({ 
      message: 'Logs processed successfully',
      stats
    });
  } catch (err) {
    console.error('Error processing logs:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs/:type', async (req, res) => {
  const { type } = req.params;
  const { limit = 500, offset = 0 } = req.query;
  
  try {
    const connection = await pool.getConnection();
    
    if (type === 'apache') {
      const [rows] = await connection.query(
        'SELECT * FROM log_apache ORDER BY fecha DESC LIMIT ? OFFSET ?',
        [parseInt(limit), parseInt(offset)]
      );
      connection.release();
      return res.json({ logs: rows });
      
    } else if (type === 'ftp') {
      const [rows] = await connection.query(
        'SELECT * FROM log_ftp ORDER BY fecha DESC LIMIT ? OFFSET ?',
        [parseInt(limit), parseInt(offset)]
      );
      connection.release();
      return res.json({ logs: rows });
      
    } else {
      connection.release();
      return res.status(400).json({ error: 'Invalid log type' });
    }
  } catch (err) {
    console.error('Error fetching logs:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/bitacora/:type', async (req, res) => {
  const { type } = req.params;
  const { limit = 100 } = req.query;
  
  try {
    const connection = await pool.getConnection();
    
    if (type === 'apache') {
      const [rows] = await connection.query(
        'SELECT * FROM bitacora_apache ORDER BY fecha DESC LIMIT ?',
        [parseInt(limit)]
      );
      connection.release();
      return res.json({ bitacora: rows });
      
    } else if (type === 'ftp') {
      const [rows] = await connection.query(
        'SELECT * FROM bitacora_ftp ORDER BY fecha DESC LIMIT ?',
        [parseInt(limit)]
      );
      connection.release();
      return res.json({ bitacora: rows });
      
    } else {
      connection.release();
      return res.status(400).json({ error: 'Invalid log type' });
    }
  } catch (err) {
    console.error('Error fetching bitacora:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
