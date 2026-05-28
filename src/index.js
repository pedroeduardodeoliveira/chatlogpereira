import { WhatsAppBot } from './bot.js';
import { createServer } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('═'.repeat(60));
  console.log('    🤖 WHATSAPP VLOOKUP (PROCV) BOT CONECTADO AO GOOGLE SHEETS');
  console.log('═'.repeat(60));
  console.log(`⏰ Horário de inicialização: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log('═'.repeat(60));

  // Validação preliminar das variáveis essenciais
  const requiredEnvVars = [
    'GOOGLE_SHEET_ID',
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PRIVATE_KEY'
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.warn('\n⚠️  CONFIGURAÇÕES INCOMPLETAS DETECTADAS:');
    missing.forEach(v => console.warn(`   - ${v} está ausente no ambiente.`));
    console.warn('\n💡 O bot tentará rodar, mas certifique-se de configurar essas variáveis no Dokploy.');
    console.warn('   Verifique a conectividade usando o diagnóstico do Dashboard Web.');
    console.log('═'.repeat(60) + '\n');
  } else {
    console.log('✅ Todas as variáveis de ambiente necessárias foram detectadas.');
    console.log('═'.repeat(60) + '\n');
  }

  // Inicializa o Bot do WhatsApp
  const bot = new WhatsAppBot();
  await bot.start();

  // Inicializa o Servidor Express (Dashboard Web + Dokploy Healthcheck)
  createServer(bot);
}

// Tratamento de encerramento amigável (Docker / Dokploy)
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido sinal SIGINT. Encerrando bot de forma limpa...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido sinal SIGTERM. Encerrando bot de forma limpa...');
  process.exit(0);
});

main().catch(err => {
  console.error('❌ Erro fatal na inicialização principal:', err);
  process.exit(1);
});
