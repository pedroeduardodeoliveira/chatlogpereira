import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { GoogleSheetsService } from './services/googleSheets';

interface MessageLog {
    timestamp: string;
    from: string;
    message: string;
    responded: boolean;
    response?: string;
}

export class WhatsAppBot {
    private client: Client;
    private sheetsService: GoogleSheetsService;
    private sheetData: any[] = [];
    private messageLog: MessageLog[] = [];
    private defaultMessage = '❌ Desculpe, não encontrei uma resposta para sua mensagem. Por favor, confira os dados e tente novamente.';

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });

        this.sheetsService = new GoogleSheetsService();
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // QR Code generation
        this.client.on('qr', (qr) => {
            console.log('\n🔐 QR CODE GERADO - Escaneie com seu WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n');
        });

        // Authentication
        this.client.on('authenticated', () => {
            console.log('✅ Autenticado com sucesso!');
        });

        // Ready
        this.client.on('ready', async () => {
            console.log('🚀 Bot do WhatsApp está pronto!');
            console.log('📱 Status: CONECTADO');
            console.log('⏰ Horário:', new Date().toLocaleString('pt-BR'));

            // Load sheet data
            await this.loadSheetData();
        });

        // Disconnected
        this.client.on('disconnected', (reason) => {
            console.log('❌ Bot desconectado. Motivo:', reason);
            console.log('📱 Status: DESCONECTADO');
        });

        // Message received
        this.client.on('message', async (message: Message) => {
            await this.handleMessage(message);
        });

        // Authentication failure
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
            console.log('📱 Status: ERRO DE AUTENTICAÇÃO');
        });
    }

    private async loadSheetData(): Promise<void> {
        try {
            this.sheetData = await this.sheetsService.loadSheetData();
            console.log(`📋 Dados da planilha carregados: ${this.sheetData.length} registros`);
        } catch (error) {
            console.error('❌ Erro ao carregar dados da planilha:', error);
        }
    }

    private async handleMessage(message: Message): Promise<void> {
        // Ignore group messages and status updates
        if (message.from.includes('@g.us') || message.isStatus) {
            return;
        }

        const timestamp = new Date().toLocaleString('pt-BR');
        const from = message.from;
        const userMessage = message.body;

        console.log('\n📨 MENSAGEM RECEBIDA');
        console.log(`⏰ Horário: ${timestamp}`);
        console.log(`👤 De: ${from}`);
        console.log(`💬 Mensagem: ${userMessage}`);

        // Find answer in sheet data
        const answer = this.sheetsService.findAnswer(this.sheetData, userMessage);

        let responded = false;
        let responseText = '';

        if (answer) {
            responseText = answer;
            responded = true;
            console.log(`✅ Resposta encontrada: ${responseText}`);
        } else {
            responseText = this.defaultMessage;
            responded = true;
            console.log(`⚠️  Resposta não encontrada - enviando mensagem padrão`);
        }

        // Send response
        try {
            await message.reply(responseText);
            console.log(`📤 Resposta enviada com sucesso`);
        } catch (error) {
            console.error(`❌ Erro ao enviar resposta:`, error);
            responded = false;
        }

        // Log the message
        this.messageLog.push({
            timestamp,
            from,
            message: userMessage,
            responded,
            response: responseText,
        });

        console.log(`📊 Total de mensagens processadas: ${this.messageLog.length}`);
        console.log('─'.repeat(60));
    }

    async start(): Promise<void> {
        console.log('🔄 Iniciando bot do WhatsApp...');
        console.log('📱 Status: INICIALIZANDO');
        await this.client.initialize();
    }

    getMessageLog(): MessageLog[] {
        return this.messageLog;
    }
}
