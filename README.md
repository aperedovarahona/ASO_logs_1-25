
# 📊 Analizador de Logs para Servicios FTP & Apache

> Sistema completo para **recolección, análisis, filtrado y visualización** de archivos de log de servicios en Linux, con funcionalidades orientadas a la auditoría, seguridad y generación de reportes estadísticos. Proyecto desarrollado para la defensa final universitaria.

---

## 📌 Objetivos del Proyecto

- Automatizar la lectura y análisis de logs de **Apache** y **FTP**.
- Detectar errores y eventos críticos.
- Realizar búsquedas avanzadas por IP, fecha, texto, etc.
- Visualizar los resultados de forma clara y profesional.
- Generar reportes estadísticos útiles para administración y seguridad.

---

## 🧠 ¿Qué es un Analizador de Logs?

Un **analizador de logs** es una herramienta que permite interpretar archivos de registro generados por servidores o servicios (como Apache o FTP) para extraer información útil:

- 🧾 Auditoría de accesos
- 🛡️ Seguridad ante intentos de intrusión
- 📊 Estadísticas de uso
- ❗ Detección de errores y fallos

---

## 🧰 Funcionalidades Principales

| Código | Funcionalidad               | Descripción |
|--------|----------------------------|-------------|
| R1     | 📂 Cargar archivo de log   | Analiza y separa los datos por campos, cargándolos a una base de datos. |
| R2     | 📄 Copiar fila              | Permite copiar una línea específica del log mostrado. |
| R3     | 📑 Copiar múltiples filas   | Selección múltiple y copia en bloque. |
| R4     | 🔎 Buscador                 | Búsqueda básica y avanzada (por fecha, operadores `AND/OR`). |
| R5     | 🚨 Alertas                  | Filtrado automático de líneas con errores (códigos 4xx, 5xx). |
| R6     | 🔄 Recargar log             | Reanaliza el archivo y actualiza la base de datos. |
| R7     | 📈 Reporte estadístico      | Muestra estadísticas y gráficos basados en los datos analizados. |

---

## 🧬 Arquitectura del Sistema

```plaintext
+---------------------+
| Archivo de Log (.txt)|
+----------+----------+
           |
           v
+---------------------+
| Analizador de Logs  |  <-- Limpieza y separación por campos
+----------+----------+
           |
           v
+---------------------+
| Base de Datos (SQL) |  <-- Almacenamiento estructurado
+----------+----------+
           |
           v
+-------------------------------+
| Interfaz Web (HTML/CSS/JS)   |
| - Visualización de logs      |
| - Filtros y búsqueda avanzada|
| - Generación de reportes     |
+-------------------------------+
```

---

## 📦 Servicios Analizados

### 🌐 Apache HTTP Server
- Peticiones HTTP
- Recursos solicitados
- IPs activas
- Códigos de estado (200, 404, 500...)
- Análisis por hora, día y mes
- Referencia cruzada con `goaccess`

### 📁 FTP (vsftpd, proftpd, etc.)
- Archivos subidos/bajados
- Errores de autenticación
- Actividad por IP o usuario
- Hosts con más peticiones

---

## 🔍 Funciones de Análisis

### 1. Recolección de Logs
- Logs históricos
- Logs en tiempo real (cron o daemon)

### 2. Búsqueda y Filtrado
- Por palabra clave
- Por IP, fecha, servicio
- Soporte para expresiones regulares
- Operadores: `AND`, `OR`

### 3. Correlación de Eventos
- Agrupamiento de intentos fallidos por IP
- Detección de patrones sospechosos

### 4. Alertas Automáticas
- Errores críticos (HTTP 500, FTP login failed)
- Notificaciones (visual o por email, si se implementa)

### 5. Visualización y Clasificación
- Eventos agrupados por tipo y severidad
- Visualizaciones limpias y colores diferenciados

### 6. Reportes Automatizados
- Diarios, semanales, mensuales
- Exportación a CSV o PDF
- Resumen de actividad por servicio

---

## 🧪 Ejemplo: Log Apache

```log
192.168.1.25 - - [20/May/2025:09:33:48 +0000] "GET /index.html HTTP/1.1" 200 1043
```

🡒 Se interpreta como:

| Campo       | Valor           |
|-------------|-----------------|
| IP          | 192.168.1.25    |
| Fecha       | 20/May/2025     |
| Método      | GET             |
| Recurso     | /index.html     |
| Código HTTP | 200             |
| Tamaño      | 1043 bytes      |

---

## 🖥️ Interfaz de Usuario

🎛️ Módulos:
- Visualizador de logs
- Búsqueda por filtro o palabra
- Alertas visuales
- Gráficos y KPIs
- Botón de recarga

🎨 Diseño:
- Estilo profesional y responsivo
- Codificación por colores según tipo de evento
- Navegación clara y modular

---

## 🧑‍💻 Tecnologías Utilizadas

| Categoría     | Herramienta             |
|---------------|--------------------------|
| Lenguajes     | PHP / Python             |
| Frontend      | HTML, CSS, JavaScript    |
| Backend       | Apache                   |
| Base de Datos | MySQL / MariaDB          |
| SO            | Linux (Ubuntu/Debian)    |
| Visualización | goaccess (Apache)        |

---

## 📈 Reportes Generados

### Apache
- Recursos más accedidos
- IPs más activas
- Errores más comunes
- Estadísticas por fecha y hora

### FTP
- Archivos subidos/bajados
- Errores de login
- Actividad por host/IP

---

## 🚀 Instrucciones de Uso

```bash
# 1. Clonar el repositorio
git clone https://github.com/tuusuario/analizador-logs.git
cd analizador-logs

# 2. Instalar dependencias (según el lenguaje)
composer install        # Si usas PHP
# o
pip install -r requirements.txt   # Si usas Python

# 3. Configurar base de datos
# Edita config.php o .env con tus credenciales
```

---

## 📌 Tabla Resumen del Sistema

| Categoría        | Función                                                   |
|------------------|-----------------------------------------------------------|
| Ingreso          | Carga de archivo log                                      |
| Almacenamiento   | MySQL (campos separados por fecha, IP, método, etc.)      |
| Interacción      | HTML + JS con filtros                                     |
| Visualización    | Tablas y gráficos (colores por tipo de error)             |
| Reportes         | Generación automática en tiempo real o por cron           |
| Exportación      | Soporte para CSV / PDF (opcional)                         |

---

## 👨‍🎓 Autor del Proyecto

**Nombre Apellido**  
📧 Correo: [tuemail@ejemplo.com](mailto:tuemail@ejemplo.com)  
🔗 GitHub: [@tuusuario](https://github.com/tuusuario)

---

## 📝 Licencia

Este proyecto está bajo la licencia **MIT**.  
Consulta el archivo `LICENSE` para más detalles.

---

> 🎓 Proyecto desarrollado con el objetivo de demostrar preparación profesional y dominio en desarrollo backend, análisis de datos y administración de servicios Linux. Listo para ser presentado en defensa de tesis universitaria.
