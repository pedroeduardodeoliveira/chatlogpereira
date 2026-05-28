import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export class GoogleSheetsService {
  constructor() {
    this.clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.sheetId = process.env.GOOGLE_SHEET_ID || '';
    this.sheetTab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
    this.cacheTtl = parseInt(process.env.CACHE_TTL_MS || '2000', 10);

    this.cachedData = [];
    this.lastFetchTime = 0;
    this.activeFetchPromise = null; // Para colapsamento de requisições

    if (!this.clientEmail || !this.privateKey || !this.sheetId) {
      console.warn('⚠️ ATENÇÃO: Variáveis do Google Sheets não estão totalmente configuradas!');
    }

    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.clientEmail,
          private_key: this.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (e) {
      console.error('❌ Erro crítico ao instanciar credenciais do Google Sheets:', e.message);
    }
  }

  /**
   * Remove acentos, diacríticos e espaços extras para comparação segura
   */
  normalizeText(text) {
    if (!text) return '';
    return String(text)
      .trim()
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais mantendo espaços e letras
      .replace(/\s+/g, ' '); // Colapsa múltiplos espaços em um único
  }

  /**
   * Carrega os dados da planilha de forma altamente resiliente com controle de concorrência
   */
  async loadSheetData() {
    const now = Date.now();

    // 1. Se o cache ainda estiver válido, retorna os dados cacheados imediatamente
    if (this.cachedData.length > 0 && (now - this.lastFetchTime < this.cacheTtl)) {
      return this.cachedData;
    }

    // 2. Se já existir uma requisição ativa ao Google Sheets em andamento, aguarda ela
    if (this.activeFetchPromise) {
      console.log('🔄 Aguardando requisição já em andamento (Request Collapsing)...');
      return this.activeFetchPromise;
    }

    // 3. Inicia uma nova requisição ativa
    this.activeFetchPromise = (async () => {
      try {
        console.log(`📊 [API Google] Consultando planilha: ${this.sheetId} | Aba: ${this.sheetTab}`);
        
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.sheetId,
          range: `${this.sheetTab}!A:B`,
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
          console.warn('⚠️ Planilha vazia ou sem dados.');
          return this.cachedData; // Retorna cache em vez de quebrar
        }

        // Detecta e remove cabeçalhos
        let startIndex = 0;
        const firstRow = rows[0];
        if (firstRow && firstRow[0] && firstRow[1]) {
          const colA = this.normalizeText(firstRow[0]);
          const colB = this.normalizeText(firstRow[1]);
          const isHeader = 
            colA.includes('pergunta') || colA.includes('criterio') || colA.includes('coluna a') || colA.includes('chave') || 
            colB.includes('resposta') || colB.includes('resultado') || colB.includes('coluna b') || colB.includes('valor');
          
          if (isHeader) {
            startIndex = 1;
            console.log('📝 Cabeçalho detectado e ignorado:', firstRow);
          }
        }

        const freshData = rows
          .slice(startIndex)
          .filter(row => row[0] && row[1]) // Filtra apenas linhas com chave e valor
          .map(row => ({
            key: row[0].trim(),
            value: row[1].trim(),
          }));

        this.cachedData = freshData;
        this.lastFetchTime = Date.now();
        console.log(`✅ Dados atualizados com sucesso: ${freshData.length} registros.`);
        
        return freshData;
      } catch (error) {
        console.error('❌ Erro ao consultar a API do Google Sheets:', error.message);
        
        if (this.cachedData.length > 0) {
          console.warn('🛡️ Usando dados cacheados anteriormente como fallback de segurança.');
          return this.cachedData;
        }
        
        throw error;
      } finally {
        this.activeFetchPromise = null; // Libera o lock de requisição ativa
      }
    })();

    return this.activeFetchPromise;
  }

  /**
   * Simula um PROCV / VLOOKUP
   */
  async findAnswer(userMessage) {
    try {
      const data = await this.loadSheetData();
      const normalizedQuery = this.normalizeText(userMessage);

      console.log(`🔍 [PROCV] Buscando: "${userMessage.trim()}" (normalizado: "${normalizedQuery}")`);

      const match = data.find(
        item => this.normalizeText(item.key) === normalizedQuery
      );

      if (match) {
        console.log(`✅ [PROCV] Sucesso: "${match.key}" -> "${match.value}"`);
        return match.value;
      }

      console.log(`❌ [PROCV] Nenhum resultado para: "${userMessage.trim()}"`);
      return null;
    } catch (e) {
      console.error('❌ Falha na execução do PROCV:', e.message);
      return null;
    }
  }

  /**
   * Testa a integridade da conexão com a planilha
   */
  async testConnection() {
    try {
      if (!this.clientEmail || !this.privateKey || !this.sheetId) {
        return { success: false, message: 'Variáveis de ambiente ausentes.' };
      }
      await this.sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
      return { success: true, message: 'Conexão estabelecida com sucesso!' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}
