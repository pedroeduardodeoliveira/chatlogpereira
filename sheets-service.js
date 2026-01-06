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

// 🔹 auth
const auth = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

// Tenta autenticar imediatamente para validar as credenciais
auth.authorize().then(() => {
  console.log("✅ Google Auth com sucesso!");
}).catch(err => {
  console.error("❌ Erro na autenticação do Google:", err.message);
  console.error("Verifique se o GOOGLE_PRIVATE_KEY está correto (incluindo -----BEGIN... e quebras de linha)");
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * 🔹 MENU / COMANDOS
 * Usa a guia definida por env
 */
async function getMenuText(comando) {
  const range = `${TAB_NAME}!A:B`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = res.data.values || [];

  const linha = rows.find(
    row => row[0]?.toUpperCase() === comando.toUpperCase()
  );

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
