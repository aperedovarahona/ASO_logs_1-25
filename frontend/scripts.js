let logs = [], eventBarChart, eventPieChart, dailyLineChart;
const API = 'http://localhost:3001/api/logs';

function formatDateDisplay(sqlDateStr) {
  if (!sqlDateStr) return 'Fecha no disponible';
  try {
    const date = new Date(sqlDateStr);
    return isNaN(date.getTime()) ? sqlDateStr : date.toLocaleString();
  } catch (e) {
    console.error('Error formateando fecha:', e);
    return sqlDateStr;
  }
}

function renderTable(data) {
  const tbody = document.querySelector('#logTable tbody');
  tbody.innerHTML = data.map(e => `
    <tr>
      <td><input type="checkbox"></td>
      <td>${formatDateDisplay(e.fecha)}</td>
      <td>${e.ip_cliente || e.usuario || 'N/A'}</td>
      <td>
        ${e.metodo ? `${e.metodo} ${e.recurso} (${e.codigo_estado})` : ''}
        ${e.accion ? `${e.accion} ${e.archivo || ''} [${e.estado || ''}] ${e.bytes ? `(${e.bytes} bytes)` : ''}` : ''}
      </td>
      <td><button class="view-details-btn" data-log='${JSON.stringify(e)}'>🔍 Ver detalles</button></td>
    </tr>
  `).join('');
  
  // Agregar event listeners a los nuevos botones
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => showFullDetails(JSON.parse(btn.dataset.log)));
  });
}

function showFullDetails(log) {
  // Crear un modal para mostrar todos los detalles
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    width: 800px;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '× Cerrar';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
  `;
  closeBtn.addEventListener('click', () => modal.remove());
  
  const title = document.createElement('h2');
  title.textContent = '📋 Detalles completos del registro';
  
  const detailsTable = document.createElement('table');
  detailsTable.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  `;
  
  detailsTable.innerHTML = `
    <thead>
      <tr>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Campo</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(log).map(([key, value]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${key}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; word-break: break-all;">${value !== null && value !== undefined ? value.toString() : 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(title);
  modalContent.appendChild(detailsTable);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Cerrar modal al hacer clic fuera del contenido
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function showSelectedFile() {
  const fileInput = document.getElementById('fileInput');
  const fileName = fileInput.files[0]?.name || 'Ningún archivo seleccionado';
  document.getElementById('fileName').textContent = fileName;
}

function toggleSelectAll(e) {
  document.querySelectorAll('tbody input').forEach(cb => cb.checked = e.target.checked);
}

async function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const type = document.getElementById('logType').value;
  
  if (!file) {
    showAlert('Por favor selecciona un archivo primero', 'error');
    return;
  }

  try {
    showAlert('Analizando archivo para evitar duplicados...', 'info');
    const content = await file.text();
    
    const response = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type })
    });
    
    const result = await response.json();
    if (response.ok) {
      let message = `
        
          ${result.stats.errors > 0 ? `
            <div class="summary-item error">
              <span class="emoji">❌</span> Errores: ${result.stats.errors}
            </div>
        `   : ''}
        se subio correctamente
      `;
      
      showAlert(message, 'success');
      loadLogs();
      fileInput.value = '';
      document.getElementById('fileName').textContent = 'Ningún archivo seleccionado';
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    showAlert(`Error al procesar archivo: ${error.message}`, 'error');
  }
}

async function loadLogs() {
  try {
    const type = document.getElementById('logType').value;
    if (!['apache', 'ftp'].includes(type)) {
      throw new Error('Tipo de log no válido');
    }

    showAlert('Cargando logs...', 'info');
    const res = await fetch(`${API}/${type}?limit=500`);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Error al cargar logs');
    
    logs = data.logs;
    renderTable(logs);
    showAlert(`${logs.length} registros cargados`, 'success');
  } catch (error) {
    console.error('Error loading logs:', error);
    showAlert(`Error al cargar logs: ${error.message}`, 'error');
  }
}

function filterLogs() {
  const q = this.value.toLowerCase();
  const filtered = logs.filter(e => 
    (e.fecha && formatDateDisplay(e.fecha).toLowerCase().includes(q)) ||
    (e.ip_cliente && e.ip_cliente.toLowerCase().includes(q)) ||
    (e.usuario && e.usuario.toLowerCase().includes(q)) ||
    (e.metodo && `${e.metodo} ${e.recurso} ${e.codigo_estado}`.toLowerCase().includes(q)) ||
    (e.accion && `${e.accion} ${e.archivo} ${e.estado}`.toLowerCase().includes(q))
  );
  renderTable(filtered);
}

function copySelected() {
  const selectedCheckboxes = [...document.querySelectorAll('tbody input:checked')];
  
  if (!selectedCheckboxes.length) {
    return showAlert('Selecciona logs para copiar', 'warning');
  }

  const selectedLogs = selectedCheckboxes.map(cb => {
    const row = cb.closest('tr');
    const logData = JSON.parse(row.querySelector('.view-details-btn').dataset.log);
    // Buscar el campo original_log y si no existe, usar una representación alternativa
    return logData.original_log || 
           (logData.metodo ? `${logData.ip_cliente || '-'} - - [${formatDateForOriginal(logData.fecha)}] "${logData.metodo} ${logData.recurso} ${logData.protocolo || 'HTTP/1.1'}" ${logData.codigo_estado} ${logData.bytes || '-'} "${logData.referencia || '-'}" "${logData.user_agent || '-'}"` : 
           `${logData.fecha} ${logData.ip_cliente || '-'} ${logData.usuario || '-'} ${logData.accion} ${logData.archivo || ''} ${logData.estado || ''} ${logData.bytes || ''}`);
  });

  const textToCopy = selectedLogs.join('\n');

  navigator.clipboard.writeText(textToCopy)
    .then(() => showAlert(`${selectedLogs.length} registros copiados en su formato original`, 'success'))
    .catch(err => {
      console.error('Error al copiar:', err);
      showAlert('Error al copiar registros', 'error');
    });
}

function formatDateForOriginal(sqlDateStr) {
  if (!sqlDateStr) return '';
  try {
    const date = new Date(sqlDateStr);
    if (isNaN(date.getTime())) return sqlDateStr;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toTimeString().split(' ')[0];
    const timezone = date.toString().match(/\(([^)]+)\)/)?.[1] || '-0400';
    
    return `${day}/${month}/${year}:${time} ${timezone}`;
  } catch (e) {
    console.error('Error formateando fecha original:', e);
    return sqlDateStr;
  }
}


function showErrorsOnly() {
  const errorLogs = logs.filter(e => 
    (e.codigo_estado && e.codigo_estado >= 400) || 
    (e.estado && e.estado.toLowerCase().includes('fail'))
  );
  
  if (!errorLogs.length) {
    showAlert('No se encontraron registros de error', 'info');
  } else {
    renderTable(errorLogs);
    showAlert(`Mostrando ${errorLogs.length} registros con errores`, 'info');
  }
}

function showAlert(message, type = 'info') {
  const alertsDiv = document.getElementById('alerts');
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = message;
  alertsDiv.appendChild(alert);
  
  setTimeout(() => alert.remove(), 5000);
}

function showCharts() {
  const modal = document.getElementById('graphModal');
  modal.classList.remove('hidden');
  
  setTimeout(() => {
    if (eventBarChart) eventBarChart.destroy();
    if (eventPieChart) eventPieChart.destroy();
    if (dailyLineChart) dailyLineChart.destroy();
    
    if (logs.length > 0) {
      renderCharts();
    } else {
      document.getElementById('percentSummary').innerHTML = 
        '<div class="alert error">No hay datos para mostrar. Carga logs primero.</div>';
    }
  }, 50);
}

function hideCharts() {
  document.getElementById('graphModal').classList.add('hidden');
  
  if (eventBarChart) {
    eventBarChart.destroy();
    eventBarChart = null;
  }
  if (eventPieChart) {
    eventPieChart.destroy();
    eventPieChart = null;
  }
  if (dailyLineChart) {
    dailyLineChart.destroy();
    dailyLineChart = null;
  }
}

function getEventType(log) {
  if (log.metodo) {
    return `${log.metodo} ${Math.floor(log.codigo_estado / 100)}xx`;
  }
  const action = log.accion?.toLowerCase() || '';
  const status = log.estado?.toLowerCase() || '';
  
  if (action.includes('connect')) return 'CONNECT';
  if (action.includes('login')) return status.includes('ok') ? 'LOGIN' : 'FAIL LOGIN';
  if (action.includes('upload')) return 'UPLOAD';
  if (action.includes('download')) return 'DOWNLOAD';
  if (action.includes('mkdir')) return 'MKDIR';
  return 'OTROS';
}

function getColorForType(type) {
  const colors = {
    'GET 2xx': '#36a2eb', 'POST 2xx': '#4bc0c0', 'GET 3xx': '#9966ff',
    'GET 4xx': '#ffcd56', 'GET 5xx': '#ff6384', 'POST 4xx': '#ff9f40',
    'CONNECT': '#888', 'LOGIN': '#4bc0c0', 'FAIL LOGIN': '#ff6384',
    'UPLOAD': '#36a2eb', 'DOWNLOAD': '#ffcd56', 'MKDIR': '#9966ff',
    'OTROS': '#c9cbcf'
  };
  return colors[type] || '#ccc';
}

function renderCharts() {
  if (logs.length === 0) return;

  const eventCounts = {};
  const eventBytes = { UPLOAD: 0, DOWNLOAD: 0 };

  logs.forEach(log => {
    const type = getEventType(log);
    eventCounts[type] = (eventCounts[type] || 0) + 1;

    if (type === 'UPLOAD' || type === 'DOWNLOAD') {
      eventBytes[type] += log.bytes || 0;
    }
  });

  const eventTypes = Object.keys(eventCounts);
  const eventValues = eventTypes.map(t => eventCounts[t]);
  const totalEvents = eventValues.reduce((a, b) => a + b, 0);

  renderBarChart(eventTypes, eventValues, totalEvents);
  renderPieChart(eventTypes, eventValues);
  renderDailyLineChart(eventTypes);

  document.getElementById('percentSummary').innerHTML = `
    <div class="summary-box">
      <h3>📊 Resumen Estadístico</h3>
      ${eventBytes.UPLOAD > 0 ? `<p>📤 <strong>Upload total:</strong> ${formatBytes(eventBytes.UPLOAD)} (${(eventBytes.UPLOAD/(eventBytes.UPLOAD+eventBytes.DOWNLOAD)*100).toFixed(1)}% del tráfico)</p>` : ''}
      ${eventBytes.DOWNLOAD > 0 ? `<p>📥 <strong>Download total:</strong> ${formatBytes(eventBytes.DOWNLOAD)} (${(eventBytes.DOWNLOAD/(eventBytes.UPLOAD+eventBytes.DOWNLOAD)*100).toFixed(1)}% del tráfico)</p>` : ''}
      <p>🔢 <strong>Total eventos:</strong> ${totalEvents}</p>
      <p>📅 <strong>Período cubierto:</strong> ${getDateRange()}</p>
      <p>📈 <strong>Evento más común:</strong> ${getMostCommonEvent(eventCounts)}</p>
      ${eventCounts['FAIL LOGIN'] ? `<p>⚠️ <strong>Intentos fallidos:</strong> ${eventCounts['FAIL LOGIN']} (${(eventCounts['FAIL LOGIN']/totalEvents*100).toFixed(1)}% del total)</p>` : ''}
    </div>
  `;
}

function getDateRange() {
  if (logs.length === 0) return 'No disponible';
  
  const dates = logs.map(log => new Date(log.fecha)).filter(d => !isNaN(d.getTime()));
  if (dates.length === 0) return 'No disponible';
  
  dates.sort((a, b) => a - b);
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (${Math.round((end - start)/(1000*60*60*24))} días)`;
}

function getMostCommonEvent(eventCounts) {
  const entries = Object.entries(eventCounts);
  if (entries.length === 0) return 'No disponible';
  
  entries.sort((a, b) => b[1] - a[1]);
  const [event, count] = entries[0];
  const total = Object.values(eventCounts).reduce((a, b) => a + b, 0);
  const percentage = (count / total * 100).toFixed(1);
  
  return `${event} (${count} veces, ${percentage}%)`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function renderBarChart(labels, values, total) {
  const ctx = document.getElementById('eventBarChart');
  ctx.style.width = '100%';
  ctx.style.height = '400px';
  
  eventBarChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Eventos',
        data: values,
        backgroundColor: labels.map(getColorForType),
        borderColor: labels.map(type => darkenColor(getColorForType(type))),
        borderWidth: 1,
        hoverBackgroundColor: labels.map(type => lightenColor(getColorForType(type))),
        hoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const percentage = (ctx.raw / total * 100).toFixed(1);
              return `${ctx.label}: ${ctx.raw} eventos (${percentage}%)`;
            },
            footer: ctx => {
              const type = ctx[0].label;
              return getEventDescription(type);
            }
          }
        },
        title: { 
          display: true, 
          text: 'Distribución de Eventos por Tipo',
          font: { size: 16 }
        }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Eventos'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Tipos de Eventos'
          }
        }
      },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          showDetailedCharts(labels[elements[0].index]);
        }
      }
    }
  });
}

function darkenColor(color, amount = 20) {
  // Convert HEX to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Darken each component
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);

  // Convert back to HEX
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lightenColor(color, amount = 20) {
  // Convert HEX to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Lighten each component
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);

  // Convert back to HEX
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getEventDescription(type) {
  const descriptions = {
    'GET 2xx': 'Solicitudes exitosas (respuestas 200-299)',
    'POST 2xx': 'Envíos de datos exitosos (respuestas 200-299)',
    'GET 3xx': 'Redirecciones (respuestas 300-399)',
    'GET 4xx': 'Errores del cliente (respuestas 400-499)',
    'GET 5xx': 'Errores del servidor (respuestas 500-599)',
    'POST 4xx': 'Errores en envíos de datos (respuestas 400-499)',
    'CONNECT': 'Conexiones FTP establecidas',
    'LOGIN': 'Inicios de sesión exitosos',
    'FAIL LOGIN': 'Intentos fallidos de inicio de sesión',
    'UPLOAD': 'Archivos subidos al servidor',
    'DOWNLOAD': 'Archivos descargados del servidor',
    'MKDIR': 'Directorios creados',
    'OTROS': 'Otros tipos de eventos no categorizados'
  };
  return descriptions[type] || 'Tipo de evento no especificado';
}

function renderPieChart(labels, values) {
  const ctx = document.getElementById('eventPieChart');
  ctx.style.width = '100%';
  ctx.style.height = '400px';
  
  eventPieChart = new Chart(ctx.getContext('2d'), {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(getColorForType),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'right',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const value = ctx.raw;
              const percentage = (value / total * 100).toFixed(1);
              return `${ctx.label}: ${value} (${percentage}%)`;
            },
            footer: ctx => {
              const type = ctx[0].label;
              return getEventDescription(type);
            }
          }
        },
        title: { 
          display: true, 
          text: 'Distribución Porcentual de Eventos',
          font: { size: 16 }
        }
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      }
    }
  });
}

function renderDailyLineChart(eventTypes) {
  const dailyData = {};
  const allDays = new Set();

  logs.forEach(log => {
    const date = new Date(log.fecha);
    if (isNaN(date.getTime())) return;

    const dayStr = date.toISOString().split('T')[0];
    allDays.add(dayStr);

    if (!dailyData[dayStr]) {
      dailyData[dayStr] = {};
      eventTypes.forEach(t => dailyData[dayStr][t] = 0);
    }

    const type = getEventType(log);
    dailyData[dayStr][type]++;
  });

  const sortedDays = Array.from(allDays).sort();
  const ctx = document.getElementById('dailyLineChart');
  ctx.style.width = '100%';
  ctx.style.height = '400px';

  dailyLineChart = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: sortedDays.map(day => new Date(day).toLocaleDateString()),
      datasets: eventTypes.map(type => ({
        label: type,
        data: sortedDays.map(day => dailyData[day][type] || 0),
        backgroundColor: getColorForType(type),
        borderColor: getColorForType(type),
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: ctx => {
              const total = logs.filter(l => {
                const date = new Date(l.fecha).toISOString().split('T')[0];
                return date === sortedDays[ctx.dataIndex];
              }).length;
              const percentage = total > 0 ? (ctx.raw / total * 100).toFixed(1) : 0;
              return `${ctx.dataset.label}: ${ctx.raw} (${percentage}%)`;
            },
            footer: tooltipItems => {
              const day = sortedDays[tooltipItems[0].dataIndex];
              const dayEvents = logs.filter(l => {
                const date = new Date(l.fecha).toISOString().split('T')[0];
                return date === day;
              }).length;
              return `Total del día: ${dayEvents} eventos`;
            }
          }
        },
        title: { 
          display: true, 
          text: 'Tendencia de Actividad por Día',
          font: { size: 16 }
        }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Eventos'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Fechas'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

function showDetailedCharts(eventType) {
  document.getElementById('detailModalTitle').textContent = `🔍 Detalles: ${eventType}`;
  document.getElementById('detailModal').classList.remove('hidden');
  
  const filteredLogs = logs.filter(log => getEventType(log) === eventType);
  
  if (filteredLogs.length === 0) {
    document.querySelector('#detailModal .charts-container').innerHTML = 
      '<p>No hay datos detallados para este tipo de evento.</p>';
    return;
  }

  renderDetailCharts(filteredLogs, eventType);
}

function renderDetailCharts(filteredLogs, eventType) {
  const chartIds = ['detailBarChart', 'detailPieChart', 'hourlyChart', 'statusChart', 'userChart', 'ipChart'];
  chartIds.forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      const parent = canvas.parentNode;
      parent.removeChild(canvas);
      const newCanvas = document.createElement('canvas');
      newCanvas.id = id;
      parent.appendChild(newCanvas);
    }
  });

  renderDailyActivityChart(filteredLogs, eventType);
  renderStatusDistributionChart(filteredLogs, eventType);
  renderHourlyActivityChart(filteredLogs, eventType);
  renderStatusCodeChart(filteredLogs, eventType);
  renderTopClientsChart(filteredLogs, eventType);
  renderBytesDistributionChart(filteredLogs, eventType);
}

function renderDailyActivityChart(logs, eventType) {
  const dailyCounts = {};
  
  logs.forEach(log => {
    const date = new Date(log.fecha);
    if (isNaN(date.getTime())) return;
    
    const day = date.toLocaleDateString();
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  
  const ctx = document.getElementById('detailBarChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dailyCounts),
      datasets: [{
        label: `Eventos ${eventType}`,
        data: Object.values(dailyCounts),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: `Distribución Diaria - ${logs.length} eventos`,
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = logs.length;
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} eventos (${percentage}%)`;
            },
            footer: (context) => {
              const date = context[0].label;
              const dayEvents = logs.filter(l => 
                new Date(l.fecha).toLocaleDateString() === date
              ).length;
              return `${eventType}: ${dayEvents} de ${totalEventsOnDate(date)} eventos (${(dayEvents/totalEventsOnDate(date)*100).toFixed(1)}%)`;
            }
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Eventos'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Fechas'
          }
        }
      }
    }
  });
}

function totalEventsOnDate(dateStr) {
  return logs.filter(l => 
    new Date(l.fecha).toLocaleDateString() === dateStr
  ).length;
}

function renderStatusDistributionChart(logs, eventType) {
  const statusCounts = {};
  
  logs.forEach(log => {
    const status = log.codigo_estado || log.estado || 'N/A';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  const ctx = document.getElementById('detailPieChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: 'Distribución por Estado/Código',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = logs.length;
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        },
        legend: { 
          position: 'right',
          labels: {
            padding: 20
          }
        }
      }
    }
  });
}

function renderHourlyActivityChart(logs, eventType) {
  const hourlyCounts = Array(24).fill(0);
  
  logs.forEach(log => {
    const date = new Date(log.fecha);
    if (isNaN(date.getTime())) return;
    
    const hour = date.getHours();
    hourlyCounts[hour]++;
  });
  
  const ctx = document.getElementById('hourlyChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Eventos por hora',
        data: hourlyCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: 'Distribución por Hora del Día',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = logs.length;
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} eventos (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Eventos'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hora del día'
          }
        }
      }
    }
  });
}

function renderStatusCodeChart(logs, eventType) {
  if (!logs[0]?.codigo_estado) {
    const actionCounts = {};
    logs.forEach(log => {
      const action = log.accion || 'Desconocida';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(actionCounts),
        datasets: [{
          data: Object.values(actionCounts),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Distribución de Acciones FTP',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = logs.length;
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    return;
  }
  
  const statusCounts = {};
  logs.forEach(log => {
    const status = Math.floor(log.codigo_estado / 100) * 100 + 'xx';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  const ctx = document.getElementById('statusChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',  // 2xx
          'rgba(54, 162, 235, 0.7)',  // 3xx
          'rgba(255, 206, 86, 0.7)',  // 4xx
          'rgba(255, 99, 132, 0.7)'   // 5xx
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: 'Distribución por Códigos de Estado',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = logs.length;
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderTopClientsChart(logs, eventType) {
  const clientCounts = {};
  
  logs.forEach(log => {
    const client = log.usuario || log.ip_cliente || 'Desconocido';
    clientCounts[client] = (clientCounts[client] || 0) + 1;
  });
  
  const topClients = Object.entries(clientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const ctx = document.getElementById('userChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topClients.map(c => c[0]),
      datasets: [{
        label: 'Eventos por cliente',
        data: topClients.map(c => c[1]),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: 'Top 10 Clientes (usuarios/IPs)',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = logs.length;
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} eventos (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: { 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Eventos'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Clientes'
          }
        }
      }
    }
  });
}

function renderBytesDistributionChart(logs, eventType) {
  if (!logs[0]?.bytes) {
    const statusCounts = {};
    logs.forEach(log => {
      const status = log.estado || 'N/A';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const ctx = document.getElementById('ipChart').getContext('2d');
    new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Distribución Detallada por Estado',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = logs.length;
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    return;
  }
  
  const byteRanges = [
    '0-1KB', '1-10KB', '10-100KB', '100KB-1MB', '1MB+'
  ];
  const rangeCounts = Array(byteRanges.length).fill(0);
  
  logs.forEach(log => {
    const bytes = log.bytes || 0;
    if (bytes <= 1024) rangeCounts[0]++;
    else if (bytes <= 10240) rangeCounts[1]++;
    else if (bytes <= 102400) rangeCounts[2]++;
    else if (bytes <= 1048576) rangeCounts[3]++;
    else rangeCounts[4]++;
  });
  
  const ctx = document.getElementById('ipChart').getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: byteRanges,
      datasets: [{
        label: 'Distribución de Tamaños',
        data: rangeCounts,
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 159, 64, 1)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { 
          display: true, 
          text: 'Distribución de Tamaños de Transferencia',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = logs.length;
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        r: { 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Archivos'
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('uploadBtn').addEventListener('click', uploadFile);
  document.getElementById('reloadBtn').addEventListener('click', loadLogs);
  document.getElementById('showChartsBtn').addEventListener('click', showCharts);
  document.querySelector('#graphModal .close-modal').addEventListener('click', hideCharts);
  document.getElementById('copyBtn').addEventListener('click', copySelected);
  document.getElementById('errorsBtn').addEventListener('click', showErrorsOnly);
  document.getElementById('search').addEventListener('input', filterLogs);
  document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
  document.getElementById('selectFileBtn').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', showSelectedFile);

  document.querySelector('#detailModal .close-modal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.add('hidden');
  });

  loadLogs();
});
