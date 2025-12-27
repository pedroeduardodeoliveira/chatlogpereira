const { google } = require('googleapis');

// ================================
// Configurações via ENV (Coolify)
// ================================
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// ================================
// Validações obrigatórias
// ================================
if (!SHEET_ID) {
    throw new Error('❌ GOOGLE_SHEET_ID não configurado');
}

if (!CLIENT_EMAIL) {
    throw new Error('❌ GOOGLE_CLIENT_EMAIL não configurado');
}

if (!PRIVATE_KEY) {
    throw new Error('❌ GOOGLE_PRIVATE_KEY não configurado');
}

// ================================
// Google Sheets Client
// ================================
function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
}

// ================================
// Busca por matrícula
// ================================
async function getEmployeeResult(matricula) {
    try {
        const sheets = getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:B`,
        });

        const rows = response.data.values || [];

        for (const row of rows) {
            if (row.length < 2) continue;

            if (String(row[0]).trim() === String(matricula).trim()) {
                return {
                    matricula: row[0],
                    resultado: row[1],
                };
            }
        }

        return null;

    } catch (error) {
        console.error('❌ Erro ao acessar Google Sheets:', error);
        return null;
    }
}

// ================================
// Busca texto de menu
// ================================
async function getMenuText(chave) {
    try {
        const sheets = getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:B`,
        });

        const rows = response.data.values || [];

        for (const row of rows) {
            if (row.length < 2) continue;

            if (String(row[0]).trim().toUpperCase() === String(chave).trim().toUpperCase()) {
                return String(row[1]).trim();
            }
        }

        return null;

    } catch (error) {
        console.error('❌ Erro ao buscar menu no Google Sheets:', error);
        return null;
    }
}

module.exports = {
    getEmployeeResult,
    getMenuText,
};
