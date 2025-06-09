let logs = [];
let chartVisible = false;
let eventPieChart;
let eventBarChart;

function uploadFile() {
  const file = document.getElementById('fileInput').files[0];
  const type = document.getElementById('logType').value;
  if (!file) return alert('Selecciona un archivo para subir');

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    fetch('http://localhost:3001/api/logs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type }),
    }).then(() => loadLogs(type));
  };
  reader.readAsText(file);
}

function loadLogs(type = document.getElementById('logType').value) {
  fetch(`http://localhost:3001/api/logs/${type}`)
    .then((res) => res.json())
    .then((data) => {
      logs = data.logs.map((entry) => ({
        fecha: entry.fecha,
        ip: entry.ip,
        evento: entry.metodo
          ? `${entry.metodo} ${entry.recurso} (${entry.codigo})`
          : `${entry.accion} ${entry.archivo || ''} [${entry.estado}]`,
      }));
      renderTable(logs);
    });
}

function reloadLogs() {
  fetch('http://localhost:3001/api/logs/reload').then(() => loadLogs());
}

function renderTable(data) {
  const tbody = document.querySelector('#logTable tbody');
  tbody.innerHTML = '';
  data.forEach((entry) => {
    const row = `
      <tr>
        <td><input type="checkbox"></td>
        <td>${entry.fecha}</td>
        <td>${entry.ip}</td>
        <td>${entry.evento}</td>
      </tr>`;
    tbody.innerHTML += row;
  }) ;
}

function filterLogs() {
  const query = document.getElementById('search').value.toLowerCase();
  const filtered = logs.filter(
    (entry) =>
      entry.fecha.toLowerCase().includes(query) ||
      entry.ip.toLowerCase().includes(query) ||
      entry.evento.toLowerCase().includes(query)
  );
  renderTable(filtered);
}

function copySelected() {
  const selected = Array.from(
    document.querySelectorAll('input[type="checkbox"]:checked')
  ).map((checkbox) =>
    checkbox.closest('tr').querySelectorAll('td')[3].textContent
  );

  if (!selected.length) {
    alert('Selecciona al menos un log para copiar');
    return;
  }
  navigator.clipboard.writeText(selected.join('\n'));
  alert('Logs copiados al portapapeles');
}

function showErrorsOnly() {
  const errors = logs.filter((entry) =>
    entry.evento.toLowerCase().includes('error')
  );
  renderTable(errors);
}

// Obtener tipo general de evento para clasificación
function getTipoEvento(evento) {
  if (evento.includes('GET')) return 'GET';
  if (evento.includes('POST')) return 'POST';
  if (evento.toLowerCase().includes('error')) return 'Error';
  if (evento.toLowerCase().includes('login')) return 'Login';
  return 'Otros';
}

function renderCharts() {
  const eventCounts = {};
  logs.forEach((log) => {
    const tipo = getTipoEvento(log.evento);
    eventCounts[tipo] = (eventCounts[tipo] || 0) + 1;
  });

  const labels = Object.keys(eventCounts);
  const data = Object.values(eventCounts);

  // Gráfico de pastel
  const ctxPie = document.getElementById('eventPieChart').getContext('2d');
  if (eventPieChart) eventPieChart.destroy();

  eventPieChart = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          label: 'Eventos',
          data,
          backgroundColor: [
  '#ff6384',
  '#36a2eb',
  '#ffcd56',
  '#4bc0c0',
  '#9966ff',
  '#ff9f40',
]

        },
      ],
    },
   options: {
  responsive: false,
  maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });

  // Gráfico de barras
  const ctxBar = document.getElementById('eventBarChart').getContext('2d');
  if (eventBarChart) eventBarChart.destroy();

  eventBarChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Cantidad de eventos',
          data,
          backgroundColor: '#36a2eb',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function toggleChart() {
  const container = document.getElementById('chartContainer');
  chartVisible = !chartVisible;
  container.style.display = chartVisible ? 'flex' : 'none';
  if (chartVisible) renderCharts();
}

// Carga inicial
window.onload = () => {
  loadLogs();
};
