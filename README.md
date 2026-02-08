# Contatos CRM - Módulo de Gerenciamento de Contatos

Este é o módulo de gerenciamento de contatos do CRM Jurídico, desenvolvido em TypeScript com foco em segurança, performance e escalabilidade.

## 🏗️ Arquitetura

```
contatos-crm/
├── backend/                    # API REST em TypeScript
│   ├── src/
│   │   ├── config/            # Configurações (DB, Logger)
│   │   ├── controllers/       # Controladores da API
│   │   ├── models/           # Modelos de dados
│   │   ├── routes/           # Rotas da API
│   │   ├── middleware/       # Middlewares (Auth, Error)
│   │   ├── types/            # Tipos TypeScript
│   │   └── app.ts            # Aplicação principal
│   ├── Dockerfile            # Container do backend
│   └── package.json          # Dependências Node.js
├── frontend/                  # Interface React (futuro)
├── docker-compose.yml        # Orquestração dos containers
├── setup.sh                  # Script de setup automático
└── scripts/                  # Scripts utilitários
```

## 🚀 Início Rápido

### 1. Pré-requisitos

- Docker e Docker Compose instalados
- Banco de dados centralizado configurado (database-infrastructure)

### 2. Setup Automático

```bash
# Executar setup completo
./setup.sh
```

### 3. Setup Manual

```bash
# 1. Configurar variáveis de ambiente
cp env.example .env
# Editar .env com suas configurações

# 2. Configurar banco de dados
./scripts/setup-database.sh

# 3. Iniciar containers
docker-compose up -d

# 4. Verificar status
docker-compose ps
```

## 📋 API Endpoints

### Autenticação
Todos os endpoints (exceto `/health` e `/api/info`) requerem autenticação JWT.

### Contatos

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/contacts` | Criar novo contato | ✅ |
| GET | `/api/contacts` | Listar contatos (paginado) | ✅ |
| GET | `/api/contacts/:id` | Obter contato específico | ✅ |
| PUT | `/api/contacts/:id` | Atualizar contato | ✅ |
| DELETE | `/api/contacts/:id` | Excluir contato (soft delete) | ✅ |
| POST | `/api/contacts/:id/restore` | Restaurar contato excluído | ✅ |
| GET | `/api/contacts/stats` | Estatísticas dos contatos | ✅ |

### Sistema

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/health` | Health check | ❌ |
| GET | `/api/info` | Informações da API | ❌ |

## 🔒 Segurança

### Autenticação e Autorização
- **JWT Tokens**: Autenticação baseada em tokens
- **Company Isolation**: Usuários só acessam contatos da própria empresa
- **Role-based Access**: Controle de acesso baseado em roles
- **Rate Limiting**: Proteção contra ataques de força bruta

### Validação de Dados
- **Input Validation**: Validação rigorosa de todos os inputs
- **SQL Injection Protection**: Uso de prepared statements
- **XSS Protection**: Sanitização de dados
- **Data Sanitization**: Limpeza e formatação de dados

### Criptografia
- **SSL/TLS**: Conexões criptografadas com o banco
- **Password Hashing**: Senhas criptografadas com bcrypt
- **JWT Signing**: Tokens assinados com chave secreta

## 📊 Modelo de Dados

### Tabela: contacts
```sql
CREATE TABLE crm.contacts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES crm.companies(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Pessoa', 'Empresa')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    cpf VARCHAR(14),
    cnpj VARCHAR(18),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by INTEGER,
    updated_by INTEGER
);
```

### Validações
- **Nome**: 2-255 caracteres, apenas letras e espaços
- **Telefone**: 10-15 caracteres, formato brasileiro
- **Email**: Formato válido de email
- **CPF**: Validação de dígitos verificadores
- **CNPJ**: Validação de dígitos verificadores

## 🛠️ Desenvolvimento

### Estrutura do Backend

#### Configuração
- `src/config/database.ts`: Configuração do PostgreSQL
- `src/config/logger.ts`: Sistema de logging

#### Modelos
- `src/models/Contact.ts`: Modelo de contato com validações

#### Controladores
- `src/controllers/contactController.ts`: Lógica de negócio

#### Rotas
- `src/routes/contactRoutes.ts`: Definição das rotas

#### Middlewares
- `src/middleware/auth.ts`: Autenticação JWT
- `src/middleware/errorHandler.ts`: Tratamento de erros

#### Tipos
- `src/types/index.ts`: Definições TypeScript

### Comandos de Desenvolvimento

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Executar testes
npm test

# Linting
npm run lint
npm run lint:fix

# Verificação de tipos
npm run type-check
```

## 🐳 Docker

### Containers
- **contatos-api**: Backend Node.js/TypeScript
- **contatos-frontend**: Frontend React (futuro)
- **nginx**: Proxy reverso (opcional)

### Volumes
- `node_modules_backend`: Dependências do backend
- `node_modules_frontend`: Dependências do frontend

### Rede
- Conecta à rede `database-infrastructure_crm-network`

## 📈 Monitoramento

### Logs
- **Console**: Logs coloridos em desenvolvimento
- **Files**: Logs estruturados em produção
- **Rotation**: Rotação automática de logs

### Health Checks
- **API Health**: `/health` endpoint
- **Database Health**: Verificação de conexão
- **Container Health**: Docker health checks

### Métricas
- **Request/Response**: Logs de todas as requisições
- **Database Operations**: Tempo de execução de queries
- **Error Tracking**: Logs detalhados de erros

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Aplicação
NODE_ENV=development
API_PORT=3001
FRONTEND_PORT=3000

# Banco de Dados
DB_HOST=database-infrastructure_postgres_1
DB_PORT=5432
DB_NAME=crm_juridico
DB_USER=crm_app_user
DB_PASSWORD=CrmAppSecurePass789!@#
DB_SSL=true

# Segurança
JWT_SECRET=SuperSecretJWTKey123!@#
API_RATE_LIMIT=100
CORS_ORIGIN=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=CRM Contatos
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **API não inicia**
   ```bash
   # Verificar logs
   docker-compose logs contatos-api
   
   # Verificar configurações
   docker-compose config
   ```

2. **Erro de conexão com banco**
   ```bash
   # Verificar se o banco está rodando
   cd ../database-infrastructure
   ./scripts/manage-db.sh status
   ```

3. **Erro de autenticação**
   ```bash
   # Verificar JWT_SECRET
   echo $JWT_SECRET
   ```

4. **Erro de permissões**
   ```bash
   # Verificar usuário do banco
   docker-compose exec postgres psql -U crm_app_user -d crm_juridico
   ```

### Logs Úteis

```bash
# Logs em tempo real
docker-compose logs -f contatos-api

# Logs específicos
docker-compose logs contatos-api | grep ERROR

# Logs do banco
docker-compose logs postgres
```

## 📚 Recursos Adicionais

- [Documentação TypeScript](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**⚠️ IMPORTANTE**: Este é um ambiente de desenvolvimento. Configure adequadamente as variáveis de ambiente para produção!
