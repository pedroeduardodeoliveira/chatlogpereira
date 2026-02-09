import { google } from 'googleapis';

interface SheetData {
    question: string;
    answer: string;
}

export class GoogleSheetsService {
    private sheets;
    private sheetId: string;
    private sheetTab: string;

    constructor() {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        this.sheetId = process.env.GOOGLE_SHEET_ID || '';
        this.sheetTab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';

        if (!clientEmail || !privateKey || !this.sheetId) {
            throw new Error('Variáveis de ambiente do Google Sheets não configuradas corretamente');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    async loadSheetData(): Promise<SheetData[]> {
        try {
            console.log(`📊 Carregando dados da planilha: ${this.sheetId}, aba: ${this.sheetTab}`);

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: `${this.sheetTab}!A:B`,
            });

            const rows = response.data.values;

            if (!rows || rows.length === 0) {
                console.log('⚠️  Nenhum dado encontrado na planilha');
                return [];
            }

            // Use all rows (no header row in this sheet)
            const sheetData: SheetData[] = rows
                .filter(row => row[0] && row[1]) // Only rows with both columns filled
                .map(row => ({
                    question: row[0].trim(),
                    answer: row[1].trim(),
                }));

            console.log(`✅ ${sheetData.length} registros carregados da planilha`);
            return sheetData;
        } catch (error) {
            console.error('❌ Erro ao carregar dados da planilha:', error);
            throw error;
        }
    }

    findAnswer(sheetData: SheetData[], userMessage: string): string | null {
        const normalizedMessage = userMessage.trim();

        console.log(`🔍 Buscando resposta para: "${normalizedMessage}"`);
        console.log(`📋 Total de registros na planilha: ${sheetData.length}`);

        // Debug: show first 5 questions in the sheet
        if (sheetData.length > 0) {
            console.log('📝 Primeiras perguntas na planilha:', sheetData.slice(0, 5).map(d => `"${d.question}"`).join(', '));
        }

        const match = sheetData.find(
            data => data.question.toLowerCase() === normalizedMessage.toLowerCase()
        );

        if (match) {
            console.log(`✅ Correspondência encontrada: "${match.question}" -> "${match.answer}"`);
        } else {
            console.log(`❌ Nenhuma correspondência encontrada para: "${normalizedMessage}"`);
        }

        return match ? match.answer : null;
    }
}
