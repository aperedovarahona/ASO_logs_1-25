const fs = require('fs');
const path = require('path');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose(); // Ejemplo con SQLite

const dbFile = path.join(__dirname, 'logs.db');
const db = new sqlite3.Database(dbFile);

// Crear tablas si no existen (Ejemplo: logs_apache y logs_ftp)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS logs_apache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    datetime TEXT,
    method TEXT,
    resource TEXT,
    protocol TEXT,
    status INTEGER,
    size INTEGER,
    referrer TEXT,
    user_agent TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS logs_ftp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datetime TEXT,
    user TEXT,
    action TEXT,
    file TEXT,
    result TEXT
  )`);
});

// Función para parsear línea Apache (Ejemplo Common Log Format extendido)
function parseApacheLog(line) {
  // Patrón ejemplo para logs Apache comunes:
  // 127.0.0.1 - - [10/Oct/2023:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 2326 "http://example.com" "Mozilla/5.0"
  const regex = /^(\S+) \S+ \S+ \[(.+?)\] "(\S+) (.+?) (\S+)" (\d{3}) (\d+|-) "(.*?)" "(.*?)"$/;
  const match = line.match(regex);
  if (!match) return null;
  return {
    ip: match[1],
    datetime: match[2],
    method: match[3],
    resource: match[4],
    protocol: match[5],
    status: parseInt(match[6]),
    size: match[7] === '-' ? 0 : parseInt(match[7]),
    referrer: match[8],
    user_agent: match[9],
  };
}

// Función para parsear línea FTP (Ejemplo muy básico, ajústalo a tu log real)
function parseFtpLog(line) {
  // Supongamos formato: "2023-10-10 14:22:33 user ACTION file RESULT"
  const parts = line.split(' ');
  if (parts.length < 5) return null;
  return {
    datetime: parts[0] + ' ' + parts[1],
    user: parts[2],
    action: parts[3],
    file: parts[4],
    result: parts.slice(5).join(' ') || ''
  };
}

// Cargar archivo y analizar
async function loadLogFile(filePath, tipo) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    db.serialize(() => {
      // Antes de insertar, limpiar tabla correspondiente para recarga
      const table = tipo === 'apache' ? 'logs_apache' : 'logs_ftp';
      db.run(`DELETE FROM ${table}`);

      rl.on('line', (line) => {
        let logEntry;
        if (tipo === 'apache') {
          logEntry = parseApacheLog(line);
          if (logEntry) {
            db.run(`INSERT INTO logs_apache (ip, datetime, method, resource, protocol, status, size, referrer, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [logEntry.ip, logEntry.datetime, logEntry.method, logEntry.resource, logEntry.protocol, logEntry.status, logEntry.size, logEntry.referrer, logEntry.user_agent]);
          }
        } else if (tipo === 'ftp') {
          logEntry = parseFtpLog(line);
          if (logEntry) {
            db.run(`INSERT INTO logs_ftp (datetime, user, action, file, result) VALUES (?, ?, ?, ?, ?)`,
              [logEntry.datetime, logEntry.user, logEntry.action, logEntry.file, logEntry.result]);
          }
        }
      });

      rl.on('close', () => {
        resolve();
      });

      rl.on('error', (err) => reject(err));
    });
  });
}

// Mostrar logs desde BD
function getLogs(tipo, callback) {
  const table = tipo === 'apache' ? 'logs_apache' : 'logs_ftp';
  db.all(`SELECT * FROM ${table} ORDER BY datetime DESC`, (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, rows);
  });
}

// Ejemplo función para buscar con término simple
function searchLogs(tipo, term, callback) {
  const table = tipo === 'apache' ? 'logs_apache' : 'logs_ftp';
  const query = `SELECT * FROM ${table} WHERE `;
  const likeTerm = `%${term}%`;
  let conditions;

  if (tipo === 'apache') {
    conditions = `(ip LIKE ? OR method LIKE ? OR resource LIKE ? OR referrer LIKE ? OR user_agent LIKE ?)`;
  } else {
    conditions = `(user LIKE ? OR action LIKE ? OR file LIKE ? OR result LIKE ?)`;
  }

  db.all(query + conditions + ' ORDER BY datetime DESC', Array(tipo === 'apache' ? 5 : 4).fill(likeTerm), (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, rows);
  });
}

// Aquí agregarías tus funciones para copiar filas (depende si tienes frontend con tabla HTML y JS)
// Así como filtros para errores y reportes estadísticos (consultas SQL agregadas)

// Ejemplo exportar funciones para usar desde un servidor Express o interfaz
module.exports = {
  loadLogFile,
  getLogs,
  searchLogs,
  db,
};
