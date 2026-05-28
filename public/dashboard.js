// DASHBOARD INTERATIVO - WHATSAPP SHEETS BOT

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const headerStatusDot = document.getElementById('header-status-dot');
  const headerStatusText = document.getElementById('header-status-text');

  // Abas de Conexão
  const connInitializing = document.getElementById('connection-initializing');
  const connQr = document.getElementById('connection-qr');
  const connReady = document.getElementById('connection-ready');
  const qrImage = document.getElementById('qr-image');
  const whatsappInfo = document.getElementById('whatsapp-info');

  // Estatísticas
  const statReceived = document.getElementById('stat-received');
  const statResponded = document.getElementById('stat-responded');
  const statNoMatch = document.getElementById('stat-nomatch');
  const statErrors = document.getElementById('stat-errors');
  const startTimeText = document.getElementById('start-time');

  // Logs
  const logsTbody = document.getElementById('logs-tbody');
  const logCount = document.getElementById('log-count');

  // Diagnóstico Google Sheets
  const btnTestSheets = document.getElementById('btn-test-sheets');
  const sheetsTestResult = document.getElementById('sheets-test-result');
  const metaSheetTab = document.getElementById('meta-sheet-tab');

  // Simulador PROCV
  const procvSimForm = document.getElementById('procv-sim-form');
  const simInput = document.getElementById('sim-input');
  const simResultBox = document.getElementById('sim-result-box');
  const simResultText = document.getElementById('sim-result-text');
  const simResultBadge = document.getElementById('sim-result-badge');

  // Estados locais
  let currentStatus = 'DISCONNECTED';
  let isPolling = true;

  // Função principal para buscar status do servidor
  async function fetchStatus() {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Erro ao obter status');
      
      const data = await response.json();
      updateUI(data);
    } catch (e) {
      console.error('Falha de conexão com o servidor Express:', e);
      updateUIOffline();
    }
  }

  // Atualização offline
  function updateUIOffline() {
    headerStatusDot.className = 'status-dot disconnected';
    headerStatusText.textContent = 'ERRO DE SERVIDOR';
    
    connInitializing.classList.remove('hidden');
    connQr.classList.add('hidden');
    connReady.classList.add('hidden');
    connInitializing.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--danger);"></i>
      <p style="margin-top: 1rem;">Express Offline</p>
      <span class="subtext">O painel não pôde conectar ao servidor Express do bot. Verifique os logs do Dokploy.</span>
    `;
  }

  // Atualiza a interface com os dados recebidos
  function updateUI(data) {
    const { status, qrImage: qrBase64, stats, logs } = data;
    currentStatus = status;

    // 1. Cabeçalho & Status Dot
    headerStatusText.textContent = status === 'QR_READY' ? 'AGUARDANDO LEITURA' : status;
    
    if (status === 'CONNECTED') {
      headerStatusDot.className = 'status-dot connected';
      headerStatusText.textContent = 'CONECTADO';
    } else if (status === 'INITIALIZING') {
      headerStatusDot.className = 'status-dot initializing';
      headerStatusText.textContent = 'INICIALIZANDO';
    } else if (status === 'QR_READY') {
      headerStatusDot.className = 'status-dot qr-ready';
      headerStatusText.textContent = 'AGUARDANDO LEITURA';
    } else {
      headerStatusDot.className = 'status-dot disconnected';
      headerStatusText.textContent = 'DESCONECTADO';
    }

    // 2. Abas de Conexão
    if (status === 'CONNECTED') {
      connInitializing.classList.add('hidden');
      connQr.classList.add('hidden');
      connReady.classList.remove('hidden');
    } else if (status === 'QR_READY' && qrBase64) {
      connInitializing.classList.add('hidden');
      connReady.classList.add('hidden');
      connQr.classList.remove('hidden');
      qrImage.src = qrBase64;
    } else {
      connReady.classList.add('hidden');
      connQr.classList.add('hidden');
      connInitializing.classList.remove('hidden');
      connInitializing.innerHTML = `
        <div class="spinner"></div>
        <p>Inicializando serviço do WhatsApp...</p>
        <span class="subtext">Obtendo canal de autenticação com o Puppeteer.</span>
      `;
    }

    // 3. Atualizar Estatísticas
    statReceived.textContent = stats.totalReceived;
    statResponded.textContent = stats.totalResponded;
    statNoMatch.textContent = stats.totalNoMatch;
    statErrors.textContent = stats.totalErrors;

    const startDate = new Date(stats.startTime);
    startTimeText.textContent = startDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 4. Atualizar Logs de Atividade
    renderLogs(logs);
  }

  // Renderiza logs de atividade na tabela
  function renderLogs(logs) {
    if (!logs || logs.length === 0) {
      logsTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">Aguardando atividade do bot para listar registros...</td>
        </tr>
      `;
      logCount.textContent = '0 logs exibidos';
      return;
    }

    logCount.textContent = `${logs.length} logs exibidos`;
    
    logsTbody.innerHTML = logs.map(log => {
      let statusClass = 'success';
      let statusText = 'Sucesso';

      if (log.status === 'default') {
        statusClass = 'default';
        statusText = 'Padrão';
      } else if (log.status === 'error') {
        statusClass = 'error';
        statusText = 'Falha';
      }

      return `
        <tr>
          <td><span class="log-time">${log.timestamp}</span></td>
          <td><span class="log-number">${log.sender}</span></td>
          <td><span class="log-msg-text">"${escapeHtml(log.message)}"</span></td>
          <td><strong class="log-reply-text">${escapeHtml(log.response)}</strong></td>
          <td><span class="log-status-badge ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  }

  // Testar conexão da planilha live
  btnTestSheets.addEventListener('click', async () => {
    btnTestSheets.disabled = true;
    btnTestSheets.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Testando...';
    
    sheetsTestResult.classList.add('hidden');

    try {
      const response = await fetch('/api/sheets-test');
      const data = await response.json();

      sheetsTestResult.classList.remove('hidden');
      if (data.success) {
        sheetsTestResult.className = 'test-result success';
        sheetsTestResult.innerHTML = `
          <i class="fa-solid fa-circle-check"></i>
          <div><strong>Conexão bem sucedida!</strong><br>${data.message}</div>
        `;
      } else {
        sheetsTestResult.className = 'test-result error';
        sheetsTestResult.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div><strong>Erro de Conexão:</strong><br>${data.message}</div>
        `;
      }
    } catch (err) {
      sheetsTestResult.classList.remove('hidden');
      sheetsTestResult.className = 'test-result error';
      sheetsTestResult.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        <div><strong>Erro:</strong> Falha de rede ao conectar com a API de teste do Sheets.</div>
      `;
    } finally {
      btnTestSheets.disabled = false;
      btnTestSheets.innerHTML = '<i class="fa-solid fa-plug-circle-bolt"></i> Testar Conexão Planilha';
    }
  });

  // Simulador de PROCV
  procvSimForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = simInput.value.trim();
    if (!query) return;

    const btnSimulate = document.getElementById('btn-simulate');
    btnSimulate.disabled = true;
    btnSimulate.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    simResultBox.classList.add('hidden');

    try {
      const response = await fetch('/api/sheets-procv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();

      simResultBox.classList.remove('hidden');
      simResultText.textContent = data.result;

      if (!data.isDefault) {
        simResultBadge.className = 'sim-result-badge success-badge';
        simResultBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> PROCV Correspondência Exata';
      } else {
        simResultBadge.className = 'sim-result-badge warning-badge';
        simResultBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Retorno Padrão (Sem Match)';
      }
    } catch (err) {
      simResultBox.classList.remove('hidden');
      simResultText.textContent = 'Erro ao realizar simulação.';
      simResultBadge.className = 'sim-result-badge danger-badge';
      simResultBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Erro de Consulta';
    } finally {
      btnSimulate.disabled = false;
      btnSimulate.innerHTML = '<i class="fa-solid fa-play"></i> Buscar';
    }
  });

  // Métodos Utilitários
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Preenche dados estáticos iniciais
  async function loadMetaInfo() {
    try {
      // Como o express serve variáveis do .env indiretamente, 
      // podemos deduzir e preencher algumas informações
      const response = await fetch('/api/status');
      const data = await response.json();
      
      // Consultamos o backend para algumas metas
      metaSheetTab.textContent = 'Carregada via .env';
    } catch(e){}
  }

  // Loop de Polling
  loadMetaInfo();
  fetchStatus();
  setInterval(() => {
    if (isPolling) fetchStatus();
  }, 2000);
});
