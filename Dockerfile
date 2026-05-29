FROM node:20-slim

# Instala dependências do sistema necessárias para rodar o Puppeteer e o Chromium em modo headless
RUN apt-get update && apt-get install -y \
    git \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configura o Puppeteer para usar o Chromium instalado no sistema e evitar download desnecessário
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Configura o git para usar HTTPS no lugar de SSH ao clonar do GitHub, evitando falhas de autenticação/chaves
RUN git config --global url."https://github.com/".insteadOf ssh://git@github.com/ && \
    git config --global url."https://github.com/".insteadOf git@github.com:

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências de produção
RUN npm install

# Copia todo o resto do código da aplicação
COPY . .

# Expõe a porta para o Dokploy Health Check e Dashboard
EXPOSE 5002

# Comando para iniciar o servidor
CMD ["npm", "start"]
