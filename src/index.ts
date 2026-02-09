import dotenv from 'dotenv';
import express from 'express';
import { WhatsAppBot } from './bot';

// Load environment variables
dotenv.config();

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
    const app = express();

    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.listen(PORT, () => {
        console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
        console.log('');
    });

    // Start WhatsApp bot
    try {
        const bot = new WhatsAppBot();
        await bot.start();
    } catch (error) {
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
