const { google } = require('googleapis');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Configurações da planilha
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_TAB || 'Planilha1';

if (!SHEET_ID) {
    console.error('❌ ERRO: GOOGLE_SHEET_ID não configurado no arquivo .env');
    process.exit(1);
}

/**
 * Cria e retorna um cliente autenticado do Google Sheets
 * (MESMO MÉTODO DO SEU APP ANTIGO)
 */
function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
}

/**
 * Busca o resultado pela chave (ex: matrícula)
 */
async function getEmployeeResult(matricula) {
    try {
        const sheets = getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:B`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return null;

        for (const row of rows) {
            if (!row || row.length < 2) continue;

            if (String(row[0]).trim() === matricula) {
                return {
                    matricula: row[0],
                    resultado: row[1],
                };
            }
        }

        return null;

    } catch (error) {
        console.error('❌ Erro ao acessar Google Sheets:', error.message);
        throw error;
    }
}

/**
 * Busca texto de menu pela chave (1, 2, A, B)
 */
async function getMenuText(chave) {
    try {
        const sheets = getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:B`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return null;

        for (const row of rows) {
            if (!row || row.length < 2) continue;

            if (String(row[0]).trim().toUpperCase() === chave.toUpperCase()) {
                return String(row[1]).trim();
            }
        }

        return null;

    } catch (error) {
        console.error('❌ Erro ao buscar menu no Google Sheets:', error.message);
        throw error;
    }
}

module.exports = {
    getEmployeeResult,
    getMenuText,
};
