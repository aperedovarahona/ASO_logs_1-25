// backend/index.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const db = new sqlite3.Database('./logs.db');

// Crear tablas
function initializeDB() {
    db.run(`CREATE TABLE IF NOT EXISTS apache_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        ip TEXT,
        metodo TEXT,
        recurso TEXT,
        codigo INTEGER,
        user_agent TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ftp_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        ip TEXT,
        usuario TEXT,
        accion TEXT,
        archivo TEXT,
        estado TEXT
    )`);
}

initializeDB();

// Cargar logs al backend
app.post('/api/logs/upload', (req, res) => {
    const { content, type } = req.body; // type: 'apache' o 'ftp'
    const lines = content.split('\n');

    if (type === 'apache') {
        const apacheRegex = /^(\S+) - - \[(.*?)\] "(\S+) (.*?) HTTP.*?" (\d{3}) .*?".*?" "(.*?)"/;

        const stmt = db.prepare(`INSERT INTO apache_logs (ip, fecha, metodo, recurso, codigo, user_agent) VALUES (?, ?, ?, ?, ?, ?)`);
        lines.forEach(line => {
            const match = line.match(apacheRegex);
            if (match) {
                const [, ip, fecha, metodo, recurso, codigo, user_agent] = match;
                stmt.run(ip, fecha, metodo, recurso, parseInt(codigo), user_agent);
            }
        });
        stmt.finalize();
        res.send({ status: 'Apache logs cargados' });

    } else if (type === 'ftp') {
        const ftpRegex = /\[(.*?)\] (\S+) (\S+) (upload|download|login|error) (.*?) (success|fail)/i;

        const stmt = db.prepare(`INSERT INTO ftp_logs (fecha, ip, usuario, accion, archivo, estado) VALUES (?, ?, ?, ?, ?, ?)`);
        lines.forEach(line => {
            const match = line.match(ftpRegex);
            if (match) {
                const [, fecha, ip, usuario, accion, archivo, estado] = match;
                stmt.run(fecha, ip, usuario, accion, archivo, estado);
            }
        });
        stmt.finalize();
        res.send({ status: 'FTP logs cargados' });
    } else {
        res.status(400).send({ error: 'Tipo de log no soportado' });
    }
});

// Obtener logs
app.get('/api/logs/:type', (req, res) => {
    const { type } = req.params;
    const table = type === 'apache' ? 'apache_logs' : 'ftp_logs';

    db.all(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 500`, [], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.send({ logs: rows });
    });
});

// Recargar logs (ejemplo básico desde archivo local)
app.get('/api/logs/reload', (req, res) => {
    const content = fs.readFileSync('./logs/apache_example.log', 'utf8');
    // Simula subir logs (puedes cambiar esto por un flujo similar al POST)
    req.body = { content, type: 'apache' };
    app._router.handle(req, res, () => {}, 'post');
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
