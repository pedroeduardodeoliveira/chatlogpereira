const { google } = require("googleapis");

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TAB_NAME = process.env.GOOGLE_SHEET_TAB;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// 🔴 validações
if (!SHEET_ID) throw new Error("❌ GOOGLE_SHEET_ID não configurado");
if (!TAB_NAME) throw new Error("❌ GOOGLE_SHEET_TAB não configurado");
if (!CLIENT_EMAIL) throw new Error("❌ GOOGLE_CLIENT_EMAIL não configurado");
if (!PRIVATE_KEY) throw new Error("❌ GOOGLE_PRIVATE_KEY não configurado");

const fs = require('fs');
const path = require('path');

// 🔹 auth
console.log(`🔑 Config Auth Check:`);
console.log(`   Email: '${CLIENT_EMAIL}'`);

// Estratégia: Salvar credenciais em arquivo temporário para garantir que o GoogleAuth leia corretamente
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');

try {
  const credentials = {
    "type": "service_account",
    "private_key": PRIVATE_KEY,
    "client_email": CLIENT_EMAIL,
    "token_uri": "https://oauth2.googleapis.com/token"
  };

  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials));
  console.log(`✅ Arquivo de credenciais criado em: ${CREDENTIALS_PATH}`);
} catch (err) {
  console.error("❌ Erro ao criar arquivo de credenciais:", err);
}

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// Tenta autenticar imediatamente
auth.getClient().then(client => {
  console.log("✅ Google Auth com sucesso! (File Strategy)");
}).catch(err => {
  console.error("❌ Erro na autenticação do Google:", err.message);
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * 🔹 MENU / COMANDOS
 * Usa a guia definida por env
 */
async function getMenuText(comando) {
  console.log(`🔍 Buscando MENU: "${comando}" na aba "${TAB_NAME}"`);
  const range = `${TAB_NAME}!A:B`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = res.data.values || [];
  console.log(`📊 Total de linhas baixadas: ${rows.length}`);

  const linha = rows.find(
    row => row[0]?.toUpperCase() === comando.toUpperCase()
  );

  console.log(`✅ Resultado encontrado:`, linha ? "SIM" : "NÃO");
  return linha ? linha[1] : null;
}

/**
 * 🔹 MATRÍCULA → RESULTADO
 */
async function getEmployeeResult(matricula) {
  const range = `${TAB_NAME}!A:B`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = res.data.values || [];

  const linha = rows.find(row => row[0] === matricula);

  return linha ? { resultado: linha[1] } : null;
}

module.exports = {
  getMenuText,
  getEmployeeResult,
};
