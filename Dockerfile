FROM node:20-slim

# Instala TODAS as dependências necessárias para o Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxfixes3 \
    libxshmfence1 \
    libxkbcommon0 \
    libgtk-3-0 \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Deixe o Puppeteer baixar o Chromium correto
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV NODE_OPTIONS=--openssl-legacy-provider

# Porta correta
ENV PORT=5001
EXPOSE 5001

CMD ["npm", "start"]
