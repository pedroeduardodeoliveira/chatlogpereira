import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(bot) {
  const app = express();
  const PORT = process.env.PORT || 5002;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Dokploy Healthcheck
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Endpoints da API para o Dashboard Web
  app.get('/api/status', (req, res) => {
    res.json(bot.getStatus());
  });

  // Testar conexão com o Google Sheets
  app.get('/api/sheets-test', async (req, res) => {
    try {
      const result = await bot.sheetsService.testConnection();
      res.json(result);
    } catch (e) {
      res.json({ success: false, message: e.message });
    }
  });

  // Simular busca PROCV na planilha (Super recurso de teste!)
  app.post('/api/sheets-procv', async (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Nenhuma consulta informada.' });
    }

    try {
      const result = await bot.sheetsService.findAnswer(query);
      res.json({
        query,
        found: !!result,
        result: result || bot.defaultReply,
        isDefault: !result
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`🌐 [Express] Servidor HTTP ativo na porta ${PORT}`);
    console.log(`📊 [Express] Dashboard Web disponível em: http://localhost:${PORT}\n`);
  });

  return app;
}
