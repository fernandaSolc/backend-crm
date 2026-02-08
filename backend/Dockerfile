# Dockerfile para Backend API - Contatos CRM (TypeScript)
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    bash

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover dependências de desenvolvimento
RUN npm prune --production

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Criar diretório de logs
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Alterar propriedade dos arquivos
RUN chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando para iniciar a aplicação
CMD ["npm", "start"]
