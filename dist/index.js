"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const bot_1 = require("./bot");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 5002;
async function main() {
    console.log('═'.repeat(60));
    console.log('🤖 WhatsApp Bot com Google Sheets');
    console.log('═'.repeat(60));
    console.log('');
    // Validate environment variables
    const requiredEnvVars = [
        'GOOGLE_SHEET_ID',
        'GOOGLE_SHEET_TAB',
        'GOOGLE_CLIENT_EMAIL',
        'GOOGLE_PRIVATE_KEY',
    ];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('❌ Variáveis de ambiente faltando:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.error('\n💡 Configure as variáveis no Dokploy ou no arquivo .env');
        process.exit(1);
    }
    console.log('✅ Variáveis de ambiente configuradas');
    console.log('');
    // Create Express server for health check (required by Dokploy)
    const app = (0, express_1.default)();
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.listen(PORT, () => {
        console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
        console.log('');
    });
    // Start WhatsApp bot
    try {
        const bot = new bot_1.WhatsAppBot();
        await bot.start();
    }
    catch (error) {
        console.error('❌ Erro ao iniciar o bot:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Encerrando bot...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n\n🛑 Encerrando bot...');
    process.exit(0);
});
main();
