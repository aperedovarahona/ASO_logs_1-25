// Importación de módulos necesarios

const express = require('express'); 
const cors = require('cors'); 
const sqlite3 = require('sqlite3').verbose(); 
const bodyParser = require('body-parser'); 
const fs = require('fs');
const path = require('path'); 

// Inicialización de la aplicación Express
const app = express();
// Definición del puerto donde se ejecutará el servidor
const PORT = 3001;

// Middleware para permitir peticiones de diferentes orígenes
app.use(cors());
// Middleware para aceptar peticiones con cuerpo en formato JSON, hasta 10MB de tamaño
app.use(bodyParser.json({ limit: '10mb' }));

// Conexión a la base de datos SQLite, archivo local llamado logs.db
const db = new sqlite3.Database('./logs.db');

function initializeDB() {
    // Tabla para logs de Apache
    db.run(`CREATE TABLE IF NOT EXISTS apache_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        ip TEXT,
        metodo TEXT,
        recurso TEXT,
        codigo INTEGER,
        user_agent TEXT
    )`);

    // Tabla para logs de FTP
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
// Llamada a la función para asegurar que las tablas existen
initializeDB();

// Ruta para cargar logs al backend (se llama desde el frontend con método POST)
app.post('/api/logs/upload', (req, res) => {
    const { content, type } = req.body; 
    const lines = content.split('\n'); 

    // Si el tipo es Apache
    if (type === 'apache') {
        const apacheRegex = /^(\S+) - - \[(.*?)\] "(\S+) (.*?) HTTP.*?" (\d{3}) .*?".*?" "(.*?)"/;
        const stmt = db.prepare(`INSERT INTO apache_logs (ip, fecha, metodo, recurso, codigo, user_agent) VALUES (?, ?, ?, ?, ?, ?)`);

        // Para cada línea, aplicar el regex y guardar en la base de datos si hay coincidencia
        lines.forEach(line => {
            const match = line.match(apacheRegex);
            if (match) {
                const [, ip, fecha, metodo, recurso, codigo, user_agent] = match;
                stmt.run(ip, fecha, metodo, recurso, parseInt(codigo), user_agent);
        }
        });

        stmt.finalize();
        res.send({ status: 'Apache logs cargados' }); 

    // Si el tipo es FTP
       } else if (type === 'ftp') {
        // Regex para logs estilo vsftpd
        const ftpRegex = /^(.{24}) \[pid \d+\](?: \[(.*?)\])? (OK|FAIL) (LOGIN|UPLOAD|DOWNLOAD): Client "(.*?)"/;

        const stmt = db.prepare(`INSERT INTO ftp_logs (fecha, ip, usuario, accion, archivo, estado) VALUES (?, ?, ?, ?, ?, ?)`);

        lines.forEach(line => {
            const match = line.match(ftpRegex);
            if (match) {
                const [ , fecha, usuarioRaw, estado, accion, ip ] = match;

                const usuario = usuarioRaw?.trim() || 'desconocido';
                const archivo = accion === 'UPLOAD' || accion === 'DOWNLOAD' ? `${accion.toLowerCase()} (vsftpd)` : '-';

                stmt.run(fecha.trim(), ip, usuario, accion.toLowerCase(), archivo, estado.toLowerCase());
            }
        });

        stmt.finalize();
        res.send({ status: 'FTP logs cargados (vsftpd)' });


    } else {
        // Si el tipo de log no es válido
        res.status(400).send({ error: 'Tipo de log no soportado' });
    }
});

// Ruta para obtener logs desde la base de datos, tipo apache o ftp
app.get('/api/logs/:type', (req, res) => {
    const { type } = req.params; 
    const table = type === 'apache' ? 'apache_logs' : 'ftp_logs'; 

    // Consulta a la base de datos para obtener los últimos 500 registros
    db.all(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 500`, [], (err, rows) => {
        if (err) return res.status(500).send(err); 
        res.send({ logs: rows }); 
    });
});

// Ruta para recargar logs desde un archivo local (ejemplo apache_example.log)
app.get('/api/logs/reload', (req, res) => {
    const content = fs.readFileSync('./logs/apache_example.log', 'utf8'); 
    req.body = { content, type: 'apache' }; 
    app._router.handle(req, res, () => {}, 'post');
});

// Servir los archivos del frontend estático (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Ruta raíz que sirve el archivo index.html del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Inicia el servidor y escucha en el puerto definido
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

// Función auxiliar que se menciona pero no se utiliza en el servidor (probablemente parte del frontend)
function processLogs(content) {
    const lines = content.split('\n'); // Divide el contenido en líneas
    logs = lines.map(line => parseLog(line)).filter(entry => entry);
        renderTable(logs); 
        detectSuspiciousEvents(); 
        renderEventChart();
}
