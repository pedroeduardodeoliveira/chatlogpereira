FROM node:20-slim

# Instala dependências necessárias para o Chromium (Puppeteer)
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
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install --production

# Copia o restante do projeto
COPY . .

# Evita download duplicado do Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Porta do app (5001)
ENV PORT=5001
EXPOSE 5001

# Comando de start
CMD ["npm", "start"]
