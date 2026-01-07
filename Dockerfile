FROM node:18-slim

# Instalar dependências do Chrome/Puppeteer
# Veja: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependência primeiro
COPY package*.json ./

# Instalar dependências
# --omit=dev para produção, mas whatsapp-web.js precisa de puppeteer
RUN npm ci

# Copiar resto do código
COPY . .

# Variáveis de ambiente padrão para o Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Expor portas (Interface Web)
EXPOSE 3112

# Comando de inicialização
CMD [ "npm", "start" ]
