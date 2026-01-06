const qrcode = require("qrcode-terminal");
const QRCode = require('qrcode');
const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config({ quiet: true });

const { getEmployeeResult, getMenuText } = require("./sheets-service");

// --------------------
// WhatsApp Bot Setup
// --------------------
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }
});

// Delay helper
const wait = ms => new Promise(res => setTimeout(res, ms));

// Função para enviar mensagem simulando "digitando..."
async function enviarComDigitando(chatId, texto) {
    const delayTempo = 500 + Math.random() * 1500; // 0.5s a 2s
    await wait(delayTempo);
    await client.sendMessage(chatId, texto);
}

// --------------------
// Web Interface Setup
// --------------------
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + "/public"));
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));

// 🔧 PORTA CORRIGIDA PARA 5001 (compatível com Coolify)
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`🚀 Interface web rodando na porta ${PORT}`);
});

// Conjunto de sockets conectados
const connectedSockets = new Set();

// Contador de mensagens do dia
let contadorMensagens = 0;

io.on("connection", socket => {
    console.log("🌐 Cliente web conectado");
    connectedSockets.add(socket);

    // Envia status atual do bot
    if (client.info && client.info.wid) {
        socket.emit("status", "Conectado");
    } else {
        socket.emit("status", "Aguardando conexão...");
    }

    // Envia contador atual
    socket.emit("contador", contadorMensagens);

    // Envia todo log armazenado (persistente após refresh)
    if (globalLogs && globalLogs.length) {
        globalLogs.forEach(log => socket.emit("log", log));
    }

    socket.on("disconnect", () => connectedSockets.delete(socket));
});

// Armazena logs globalmente
let globalLogs = [];

function enviarLog(log) {
    globalLogs.push(log);
    for (const socket of connectedSockets) {
        socket.emit("log", log);
    }
}

function atualizarContador() {
    for (const socket of connectedSockets) {
        socket.emit("contador", contadorMensagens);
    }
}

// --------------------
// WhatsApp Events
// --------------------
client.on("qr", qr => {
    console.log("📱 Escaneie o QR code abaixo:");
    qrcode.generate(qr, { small: true });

    // Gera QR Code para enviar pro front
    QRCode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro ao gerar QR code", err);
            return;
        }
        for (const socket of connectedSockets) {
            socket.emit("qr", url);
            socket.emit("status", "Aguardando leitura do QR Code...");
        }
    });
});

client.on("ready", () => {
    console.log("🤖 Bot conectado e funcionando!");
    for (const socket of connectedSockets) {
        socket.emit("status", "Conectado");
        socket.emit("qr", null); // Limpa QR code
    }
});

client.on("message", async msg => {
    const texto = msg.body.trim();
    const fromNumber = msg.from.replace(/@c\.us$/, "");
    let respondeu = false;

    // Se for número → matrícula
    if (/^\d+$/.test(texto)) {
        const result = await getEmployeeResult(texto);
        if (result) {
            await enviarComDigitando(msg.from, result.resultado);
            respondeu = true;
        } else {
            await enviarComDigitando(msg.from, "❌ Matrícula não encontrada, tente novamente.");
        }
    } else {
        const menu = await getMenuText(texto);
        if (menu) {
            await enviarComDigitando(msg.from, menu);
            respondeu = true;
        }
    }

    if (!respondeu) {
        await enviarComDigitando(msg.from, "🤖 Não entendi. Digite *MENU* para voltar.");
    }

    contadorMensagens++;
    atualizarContador();

    const log = `📨 Mensagem recebida de: ${fromNumber} | Mensagem: ${texto} | Respondida: ${respondeu ? "Sim" : "Não"}`;
    console.log(log);
    enviarLog(log);
});

// Inicializa o bot
client.initialize();
