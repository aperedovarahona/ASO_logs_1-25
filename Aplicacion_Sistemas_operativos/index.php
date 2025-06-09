<?php
// index.php - ejecutar con: php -S localhost:8000

// Configuración base de datos
$host = 'localhost';
$db = 'ASO';
$user = 'jorge';    // Cambia si usas otro usuario
$pass = '4515';     // Cambia si tienes contraseña
$charset = 'utf8mb4';

// Crear conexión PDO
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (Exception $e) {
    die("Error conexión DB: " . $e->getMessage());
}

// Función para parsear línea log Apache
function parseApacheLine(string $line): ?array {
    $pattern = '/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) ([^"]+) (\S+)" (\d{3}) (\d+) "([^"]*)" "([^"]*)"$/';
    if (preg_match($pattern, $line, $m)) {
        $date = DateTime::createFromFormat('d/M/Y:H:i:s O', $m[2]);
        return [
            'ip_cliente' => $m[1],
            'fecha' => $date ? $date->format('Y-m-d H:i:s') : null,
            'zona_horaria' => substr($m[2], -5),
            'metodo' => $m[3],
            'recurso' => $m[4],
            'protocolo' => $m[5],
            'codigo_estado' => (int)$m[6],
            'tamano_respuesta' => (int)$m[7],
            'referer' => $m[8],
            'user_agent' => $m[9],
            'linea_original' => $line
        ];
    }
    return null;
}

// Función para parsear línea log FTP
function parseFtpLine(string $line): ?array {
    $pattern = '/^(\w{3} \w{3} \d{1,2} \d{2}:\d{2}:\d{2} \d{4}) \[pid (\d+)\] (\w+): Client "(.*)"$/';
    if (preg_match($pattern, $line, $m)) {
        $date = DateTime::createFromFormat('D M d H:i:s Y', $m[1]);
        return [
            'fecha' => $date ? $date->format('Y-m-d H:i:s') : null,
            'fecha_texto' => $m[1],
            'pid' => (int)$m[2],
            'accion' => $m[3],
            'cliente_ip' => $m[4],
            'usuario' => null,
            'archivo' => null,
            'tamanio' => null,
            'duracion' => null,
            'estado' => null,
            'linea_original' => $line
        ];
    }
    return null;
}

$mensaje = '';
$tipo_log_ver = 'apache';  // Default tipo

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tipo_log = $_POST['tipo_log'] ?? '';
    $tipo_log_ver = $tipo_log; // Para mostrar el tipo correcto luego

    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        $mensaje = "Error al subir archivo: " . ($_FILES['archivo']['error'] ?? 'Archivo no recibido');
    } elseif (!in_array($tipo_log, ['apache', 'ftp'], true)) {
        $mensaje = "Tipo de log no válido.";
    } else {
        // Borra registros previos según tipo
        try {
            if ($tipo_log === 'apache') {
                $pdo->exec("DELETE FROM log_apache");
            } else {
                $pdo->exec("DELETE FROM log_ftp");
            }
        } catch (Exception $e) {
            die("Error al limpiar registros previos: " . $e->getMessage());
        }

        // Procesar archivo
        $tmpFile = $_FILES['archivo']['tmp_name'];
        $lines = file($tmpFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $insertados = 0;

        try {
            if ($tipo_log === 'apache') {
                $stmt = $pdo->prepare("INSERT INTO log_apache 
                    (ip_cliente, fecha, zona_horaria, metodo, recurso, protocolo, codigo_estado, tamano_respuesta, referer, user_agent, linea_original)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($lines as $line) {
                    $data = parseApacheLine($line);
                    if ($data) {
                        $stmt->execute([
                            $data['ip_cliente'], $data['fecha'], $data['zona_horaria'], $data['metodo'], $data['recurso'], $data['protocolo'],
                            $data['codigo_estado'], $data['tamano_respuesta'], $data['referer'], $data['user_agent'], $data['linea_original']
                        ]);
                        $insertados++;
                    }
                }
                $mensaje = "Insertados $insertados registros Apache.";
            } else {
                $stmt = $pdo->prepare("INSERT INTO log_ftp
                    (fecha, fecha_texto, pid, accion, cliente_ip, usuario, archivo, tamanio, duracion, estado, linea_original)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($lines as $line) {
                    $data = parseFtpLine($line);
                    if ($data) {
                        $stmt->execute([
                            $data['fecha'], $data['fecha_texto'], $data['pid'], $data['accion'], $data['cliente_ip'],
                            $data['usuario'], $data['archivo'], $data['tamanio'], $data['duracion'], $data['estado'], $data['linea_original']
                        ]);
                        $insertados++;
                    }
                }
                $mensaje = "Insertados $insertados registros FTP.";
            }
        } catch (Exception $e) {
            $mensaje = "Error al insertar registros: " . $e->getMessage();
        }
    }
}

// Mostrar últimos registros
try {
    if ($tipo_log_ver === 'ftp') {
        $logs = $pdo->query("SELECT * FROM log_ftp ORDER BY id DESC LIMIT 100")->fetchAll();
    } else {
        $logs = $pdo->query("SELECT * FROM log_apache ORDER BY id DESC LIMIT 100")->fetchAll();
    }
} catch (Exception $e) {
    die("Error al obtener registros: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Subida y visualización de logs Apache / FTP</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 0.9em; }
        th { background: #eee; }
        textarea { width: 100%; height: 50px; }
        .mensaje { background: #dfd; padding: 10px; margin: 10px 0; border: 1px solid #9c9; }
    </style>
</head>
<body>
    <h1>Subir archivos de logs Apache o FTP</h1>

    <?php if ($mensaje): ?>
        <div class="mensaje"><?=htmlspecialchars($mensaje)?></div>
    <?php endif; ?>

    <form method="POST" enctype="multipart/form-data">
        <label for="tipo_log">Selecciona tipo de log:</label>
        <select name="tipo_log" id="tipo_log" required onchange="this.form.submit()">
            <option value="apache" <?=($tipo_log_ver==='apache')?'selected':''?>>Apache</option>
            <option value="ftp" <?=($tipo_log_ver==='ftp')?'selected':''?>>FTP</option>
        </select><br><br>

        <label for="archivo">Selecciona archivo de log:</label><br>
        <input type="file" name="archivo" id="archivo" required accept=".log,.txt"><br><br>

        <button type="submit">Subir y procesar</button>
    </form>

    <h2>Últimos registros de <?=htmlspecialchars(strtoupper($tipo_log_ver))?></h2>
    <table>
        <thead>
            <tr>
                <?php if ($tipo_log_ver === 'apache'): ?>
                    <th>ID</th><th>IP Cliente</th><th>Fecha</th><th>Zona Horaria</th><th>Método</th>
                    <th>Recurso</th><th>Protocolo</th><th>Código Estado</th><th>Tamaño Resp.</th>
                    <th>Referer</th><th>User Agent</th><th>Línea Original</th>
                <?php else: ?>
                    <th>ID</th><th>Fecha</th><th>Fecha Texto</th><th>PID</th><th>Acción</th><th>Cliente IP</th>
                    <th>Usuario</th><th>Archivo</th><th>Tamaño</th><th>Duración</th><th>Estado</th><th>Línea Original</th>
                <?php endif; ?>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($logs as $log): ?>
                <tr>
                    <?php if ($tipo_log_ver === 'apache'): ?>
                        <td><?=htmlspecialchars($log['id'])?></td>
                        <td><?=htmlspecialchars($log['ip_cliente'])?></td>
                        <td><?=htmlspecialchars($log['fecha'])?></td>
                        <td><?=htmlspecialchars($log['zona_horaria'])?></td>
                        <td><?=htmlspecialchars($log['metodo'])?></td>
                        <td><?=htmlspecialchars($log['recurso'])?></td>
                        <td><?=htmlspecialchars($log['protocolo'])?></td>
                        <td><?=htmlspecialchars($log['codigo_estado'])?></td>
                        <td><?=htmlspecialchars($log['tamano_respuesta'])?></td>
                        <td><?=htmlspecialchars($log['referer'])?></td>
                        <td><?=htmlspecialchars($log['user_agent'])?></td>
                        <td><textarea readonly><?=htmlspecialchars($log['linea_original'])?></textarea></td>
                    <?php else: ?>
                        <td><?=htmlspecialchars($log['id'])?></td>
                        <td><?=htmlspecialchars($log['fecha'])?></td>
                        <td><?=htmlspecialchars($log['fecha_texto'])?></td>
                        <td><?=htmlspecialchars($log['pid'])?></td>
                        <td><?=htmlspecialchars($log['accion'])?></td>
                        <td><?=htmlspecialchars($log['cliente_ip'])?></td>
                        <td><?=htmlspecialchars($log['usuario'])?></td>
                        <td><?=htmlspecialchars($log['archivo'])?></td>
                        <td><?=htmlspecialchars($log['tamanio'])?></td>
                        <td><?=htmlspecialchars($log['duracion'])?></td>
                        <td><?=htmlspecialchars($log['estado'])?></td>
                        <td><textarea readonly><?=htmlspecialchars($log['linea_original'])?></textarea></td>
                    <?php endif; ?>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

</body>
</html>
