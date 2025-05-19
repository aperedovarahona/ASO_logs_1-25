let logs = [];

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        processLogs(content);
    };
    reader.readAsText(file);
});

function processLogs(content) {
    const lines = content.split('\n');
    logs = lines.map(line => parseLog(line)).filter(entry => entry);
    renderTable(logs);
    detectSuspiciousEvents();
}

function parseLog(line) {
    // Detectar formato simple: [fecha] IP evento
    const regex = /\[([^\]]+)\]\s+(\d{1,3}(?:\.\d{1,3}){3})\s+(.*)/;
    const match = line.match(regex);
    if (match) {
        return {
            fecha: match[1],
            ip: match[2],
            evento: match[3]
        };
    }
    return null;
}

function renderTable(data) {
    const tbody = document.querySelector('#logTable tbody');
    tbody.innerHTML = '';
    data.forEach(entry => {
        const row = `<tr>
            <td>${entry.fecha}</td>
            <td>${entry.ip}</td>
            <td>${entry.evento}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function filterLogs() {
    const query = document.getElementById('search').value.toLowerCase();
    const filtered = logs.filter(entry =>
        entry.fecha.toLowerCase().includes(query) ||
        entry.ip.toLowerCase().includes(query) ||
        entry.evento.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

function detectSuspiciousEvents() {
    const failedLogins = logs.filter(log => log.evento.toLowerCase().includes('failed login'));
    const ipCounts = {};

    failedLogins.forEach(log => {
        ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
    });

    const suspiciousIPs = Object.entries(ipCounts).filter(([ip, count]) => count >= 5);

    const alertDiv = document.getElementById('alerts');
    if (suspiciousIPs.length > 0) {
        alertDiv.innerHTML = '<p class="alert">⚠️ IPs sospechosas detectadas:</p>';
        suspiciousIPs.forEach(([ip, count]) => {
            alertDiv.innerHTML += `<p class="alert">IP ${ip} con ${count} intentos fallidos</p>`;
        });
    } else {
        alertDiv.innerHTML = '<p class="success">No se detectaron eventos sospechosos.</p>';
    }
}
