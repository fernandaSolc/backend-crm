#!/bin/bash

# Script de Setup - Projeto Contatos CRM
# =====================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para logging colorido
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Configurações
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$PROJECT_ROOT/../database-infrastructure"

# Função para verificar pré-requisitos
check_prerequisites() {
    header "Verificando Pré-requisitos"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    success "Docker encontrado: $(docker --version)"
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    fi
    success "Docker Compose encontrado: $(docker-compose --version)"
    
    # Verificar se o banco de dados está configurado
    if [ ! -d "$DATABASE_DIR" ]; then
        error "Diretório do banco de dados não encontrado: $DATABASE_DIR"
        info "Execute primeiro o setup do banco de dados centralizado"
        exit 1
    fi
    
    # Verificar se o banco está rodando
    cd "$DATABASE_DIR"
    if ! docker-compose ps postgres | grep -q "Up"; then
        warning "Banco de dados não está rodando"
        info "Iniciando banco de dados..."
        ./scripts/manage-db.sh start
    fi
    success "Banco de dados está rodando"
}

# Função para configurar arquivo de ambiente
setup_environment() {
    header "Configurando Variáveis de Ambiente"
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            log "Copiando arquivo de exemplo..."
            cp env.example .env
            success "Arquivo .env criado"
        else
            error "Arquivo env.example não encontrado!"
            exit 1
        fi
    else
        warning "Arquivo .env já existe"
    fi
    
    # Carregar variáveis de ambiente
    source .env
    
    info "Configurações carregadas:"
    info "  API Port: ${API_PORT:-3001}"
    info "  Frontend Port: ${FRONTEND_PORT:-3000}"
    info "  Database Host: ${DB_HOST}"
}

# Função para configurar banco de dados
setup_database() {
    header "Configurando Banco de Dados"
    
    log "Executando setup do banco de dados..."
    ./scripts/setup-database.sh
    
    if [ $? -eq 0 ]; then
        success "Banco de dados configurado com sucesso"
    else
        error "Falha na configuração do banco de dados"
        exit 1
    fi
}

# Função para construir e iniciar containers
start_containers() {
    header "Iniciando Containers"
    
    log "Construindo imagens Docker..."
    docker-compose build
    
    log "Iniciando serviços..."
    docker-compose up -d
    
    # Aguardar serviços estarem prontos
    log "Aguardando serviços estarem prontos..."
    sleep 15
    
    # Verificar status dos containers
    if docker-compose ps | grep -q "Up"; then
        success "Containers iniciados com sucesso"
    else
        error "Falha ao iniciar containers"
        docker-compose logs
        exit 1
    fi
}

# Função para testar API
test_api() {
    header "Testando API"
    
    local api_url="http://localhost:${API_PORT:-3001}"
    
    log "Testando health check..."
    if curl -f -s "$api_url/health" > /dev/null; then
        success "API está funcionando"
    else
        error "API não está respondendo"
        info "Verificando logs..."
        docker-compose logs contatos-api
        exit 1
    fi
    
    log "Testando endpoint de informações..."
    if curl -f -s "$api_url/api/info" > /dev/null; then
        success "Endpoint de informações funcionando"
    else
        warning "Endpoint de informações não está respondendo"
    fi
}

# Função para mostrar informações de conexão
show_connection_info() {
    header "Informações de Conexão"
    
    echo ""
    info "Backend API:"
    echo "  URL: http://localhost:${API_PORT:-3001}"
    echo "  Health: http://localhost:${API_PORT:-3001}/health"
    echo "  Info: http://localhost:${API_PORT:-3001}/api/info"
    echo ""
    
    info "Frontend:"
    echo "  URL: http://localhost:${FRONTEND_PORT:-3000}"
    echo ""
    
    info "Banco de Dados:"
    echo "  Host: ${DB_HOST:-database-infrastructure_postgres_1}"
    echo "  Port: ${DB_PORT:-5432}"
    echo "  Database: ${DB_NAME:-crm_juridico}"
    echo "  User: ${DB_USER:-crm_app_user}"
    echo ""
    
    info "Comandos úteis:"
    echo "  Status: docker-compose ps"
    echo "  Logs: docker-compose logs -f"
    echo "  Parar: docker-compose down"
    echo "  Reiniciar: docker-compose restart"
    echo ""
}

# Função para mostrar próximos passos
show_next_steps() {
    header "Próximos Passos"
    
    echo ""
    info "1. Desenvolvimento:"
    echo "   - Acesse o frontend em: http://localhost:${FRONTEND_PORT:-3000}"
    echo "   - Teste a API em: http://localhost:${API_PORT:-3001}/health"
    echo "   - Monitore logs com: docker-compose logs -f"
    echo ""
    
    info "2. Autenticação:"
    echo "   - Configure JWT_SECRET no arquivo .env"
    echo "   - Implemente sistema de login"
    echo "   - Configure middleware de autenticação"
    echo ""
    
    info "3. Frontend:"
    echo "   - Implemente interface de contatos"
    echo "   - Configure validações e máscaras"
    echo "   - Implemente feedback e toasts"
    echo ""
    
    info "4. Produção:"
    echo "   - Configure SSL/TLS"
    echo "   - Configure monitoramento"
    echo "   - Configure backup automático"
    echo ""
    
    warning "IMPORTANTE: Configure as variáveis de ambiente em .env antes de usar em produção!"
    echo ""
}

# Função para limpeza em caso de erro
cleanup_on_error() {
    error "Erro durante o setup. Limpando recursos..."
    docker-compose down 2>/dev/null || true
    exit 1
}

# Configurar trap para limpeza em caso de erro
trap cleanup_on_error ERR

# Função principal
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    Contatos CRM - Setup                      ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    check_prerequisites
    setup_environment
    setup_database
    start_containers
    test_api
    show_connection_info
    show_next_steps
    
    success "Setup do projeto Contatos CRM concluído com sucesso! 🎉"
    echo ""
    info "Para parar os serviços: docker-compose down"
    info "Para ver logs: docker-compose logs -f"
    echo ""
}

# Executar função principal
main "$@"
