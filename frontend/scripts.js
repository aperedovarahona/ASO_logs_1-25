// Esta función genera un gráfico de pastel que muestra la cantidad de eventos por tipo

function renderEventChart() {
    const eventCounts = {};

    // Recorre todos los logs y cuenta cuántos hay de cada tipo de evento
    logs.forEach(log => {
        const tipo = detectarTipoEvento(log.evento);
        eventCounts[tipo] = (eventCounts[tipo] || 0) + 1;
    });

    // Extrae etiquetas (nombres de eventos) y datos (cantidad de cada uno)
    const labels = Object.keys(eventCounts);
    const data = Object.values(eventCounts);

    // Obtiene el contexto del canvas para dibujar el gráfico
    const ctx = document.getElementById('eventChart').getContext('2d');

    // Si ya existe un gráfico, lo destruye para no duplicar
    if (window.eventChart) {
        window.eventChart.destroy();
    }

    // Crea el gráfico de tipo pastel
    window.eventChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Distribución de eventos',
                data,
                backgroundColor: [
                    '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40'
                ]
            }]
        },
        options: {
            responsive: true // Se ajusta al tamaño del contenedor
        }
    });
}

// Esta función detecta el tipo de evento a partir del texto
function detectarTipoEvento(evento) {
    evento = evento.toLowerCase(); // Convierte el texto a minúsculas para comparar mejor

    // Clasifica el tipo de evento según palabras clave
    if (evento.includes('failed login')) return 'Failed Login';
    if (evento.includes('login')) return 'Login Exitoso';
    if (evento.includes('upload')) return 'Subida';
    if (evento.includes('download')) return 'Descarga';
    return 'Otro'; // Si no coincide con nada, lo clasifica como 'Otro'
}
