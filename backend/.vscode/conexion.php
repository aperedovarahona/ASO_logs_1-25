<?php
$host = "localhost";     
$usuario = "oliver";
$contrasena = "123";
$base_datos = "ASO";

// Crear conexión
$conn = new mysqli($host, $usuario, $contrasena, $base_datos);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
} else {
    echo "Conexión exitosa a la base de datos.";
}

// Cerrar conexión (opcional en este punto)
$conn->close();
?>
