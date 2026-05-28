import pkg from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import QRCodeImage from 'qrcode';
import { GoogleSheetsService } from './services/sheets.js';
import dotenv from 'dotenv';

dotenv.config();

const { Client, LocalAuth } = pkg;

export class WhatsAppBot {
  constructor() {
    this.status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED, ERROR
    this.currentQrCode = null;    // Guarda o QR Code bruto
    this.currentQrImage = null;   // Guarda a imagem do QR Code em Base64 para o dashboard
    this.messageLogs = [];        // Guarda os logs recentes para o painel web
    this.stats = {
      totalReceived: 0,
      totalResponded: 0,
      totalNoMatch: 0,
      totalErrors: 0,
      startTime: new Date().toISOString()
    };

    this.defaultReply = process.env.DEFAULT_REPLY || '❌ Desculpe, não encontrei uma resposta para sua solicitação.';
    this.sheetsService = new GoogleSheetsService();

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'whatsapp-vlookup-bot' }),
      puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run'
        ],
        headless: true
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // 1. Geração de QR Code
    this.client.on('qr', async (qr) => {
      this.status = 'QR_READY';
      this.currentQrCode = qr;
      
      console.log('\n🔐 [WhatsApp] QR CODE GERADO - Escaneie pelo terminal do Dokploy ou pelo Dashboard:\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('\n');

      // Gera a imagem do QR Code para exibir no Dashboard Web
      try {
        this.currentQrImage = await QRCodeImage.toDataURL(qr);
      } catch (err) {
        console.error('❌ Erro ao gerar imagem do QR Code:', err.message);
      }
    });

    // 2. Autenticação iniciada
    this.client.on('authenticated', () => {
      console.log('✅ [WhatsApp] Autenticado com sucesso!');
      this.status = 'INITIALIZING';
      this.currentQrCode = null;
      this.currentQrImage = null;
    });

    // 3. Autenticação com falha
    this.client.on('auth_failure', (msg) => {
      console.error('❌ [WhatsApp] Falha de autenticação:', msg);
      this.status = 'ERROR';
    });

    // 4. Conectado e Pronto
    this.client.on('ready', async () => {
      console.log('🚀 [WhatsApp] Bot está pronto e conectado!');
      this.status = 'CONNECTED';
      this.currentQrCode = null;
      this.currentQrImage = null;

      // Pré-carrega a planilha em segundo plano
      try {
        await this.sheetsService.loadSheetData();
      } catch (err) {
        console.warn('⚠️ Falha ao pré-carregar dados da planilha. Ele tentará carregar na primeira mensagem.', err.message);
      }
    });

    // 5. Desconectado
    this.client.on('disconnected', (reason) => {
      console.warn('⚠️ [WhatsApp] Bot desconectado! Motivo:', reason);
      this.status = 'DISCONNECTED';
      this.currentQrCode = null;
      this.currentQrImage = null;
      
      // Tenta reconectar automaticamente
      console.log('🔄 Re-inicializando cliente em 5 segundos...');
      setTimeout(() => {
        this.client.initialize();
      }, 5000);
    });

    // 6. Mensagem recebida
    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });
  }

  /**
   * Processa as mensagens privadas recebidas
   */
  async handleIncomingMessage(message) {
    // Ignora mensagens de grupo e atualizações de status
    if (message.from.includes('@g.us') || message.isStatus) {
      return;
    }

    const sender = message.from;
    const body = message.body || '';
    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.stats.totalReceived++;

    let answer = null;
    let success = false;
    let isDefault = false;

    try {
      // PROCV live na planilha
      answer = await this.sheetsService.findAnswer(body);

      if (answer) {
        await message.reply(answer);
        this.stats.totalResponded++;
        success = true;
      } else {
        // Envia resposta padrão caso configurado
        if (this.defaultReply && this.defaultReply !== 'none') {
          await message.reply(this.defaultReply);
          this.stats.totalNoMatch++;
          success = true;
          isDefault = true;
        } else {
          console.log(`ℹ️ [Bot] Sem resposta correspondente e resposta padrão desativada.`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ou enviar mensagem para ${sender}:`, error.message);
      this.stats.totalErrors++;
    }

    // Registra log na memória (máximo 50 itens)
    this.addLog({
      timestamp,
      sender: sender.split('@')[0], // Apenas o número
      message: body,
      response: answer || (isDefault ? this.defaultReply : '(Nenhuma)'),
      status: success ? (isDefault ? 'default' : 'success') : 'error'
    });
  }

  addLog(entry) {
    this.messageLogs.unshift(entry);
    if (this.messageLogs.length > 50) {
      this.messageLogs.pop();
    }
  }

  async start() {
    console.log('🔄 Inicializando cliente do WhatsApp...');
    this.status = 'INITIALIZING';
    try {
      await this.client.initialize();
    } catch (e) {
      this.status = 'ERROR';
      console.error('❌ Falha crítica ao inicializar o WhatsApp:', e.message);
    }
  }

  getStatus() {
    return {
      status: this.status,
      qrImage: this.currentQrImage,
      stats: this.stats,
      logs: this.messageLogs
    };
  }
}
