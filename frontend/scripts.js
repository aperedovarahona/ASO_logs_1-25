function renderEventChart() {
    const eventCounts = {};

    logs.forEach(log => {
        const tipo = detectarTipoEvento(log.evento);
        eventCounts[tipo] = (eventCounts[tipo] || 0) + 1;
    });

    const labels = Object.keys(eventCounts);
    const data = Object.values(eventCounts);

    const ctx = document.getElementById('eventChart').getContext('2d');
    if (window.eventChart) {
        window.eventChart.destroy();
    }
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
            responsive: true
        }
    });
}

function detectarTipoEvento(evento) {
    evento = evento.toLowerCase();
    if (evento.includes('failed login')) return 'Failed Login';
    if (evento.includes('login')) return 'Login Exitoso';
    if (evento.includes('upload')) return 'Subida';
    if (evento.includes('download')) return 'Descarga';
    return 'Otro';
}
