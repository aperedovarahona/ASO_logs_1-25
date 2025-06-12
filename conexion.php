<?php
$host = "localhost";
$usuario = "alejandro";
$contrasena = "1234"; // reemplazá por tu contraseña real si es distinta
$basedatos = "ASO";

$conexion = new mysqli($host, $usuario, $contrasena, $basedatos);

if ($conexion->connect_error) {
    die("Conexión fallida: " . $conexion->connect_error);
}

echo "Conexión exitosa a la base de datos.";
?>
