#!/bin/bash

# Script para configurar o banco de dados para o módulo de contatos
# ================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_SCRIPT="$SCRIPT_DIR/create-contacts-table.sql"

# Verificar se o arquivo SQL existe
if [ ! -f "$DB_SCRIPT" ]; then
    error "Arquivo SQL não encontrado: $DB_SCRIPT"
    exit 1
fi

# Função para executar SQL no banco
execute_sql() {
    local sql_file="$1"
    local description="$2"
    
    log "Executando: $description"
    
    # Usar docker-compose para executar o SQL
    if command -v docker-compose &> /dev/null; then
        cd "$PROJECT_ROOT/../database-infrastructure"
        
        # Verificar se o banco está rodando
        if ! docker-compose ps postgres | grep -q "Up"; then
            error "Banco de dados não está rodando. Execute: ./scripts/manage-db.sh start"
            exit 1
        fi
        
        # Executar SQL
        docker-compose exec -T postgres psql -U "${POSTGRES_USER:-crm_admin}" -d "${POSTGRES_DB:-crm_juridico}" < "$sql_file"
        
        if [ $? -eq 0 ]; then
            success "$description executado com sucesso"
        else
            error "Falha ao executar: $description"
            exit 1
        fi
    else
        error "docker-compose não encontrado"
        exit 1
    fi
}

# Função para verificar se as tabelas existem
check_tables() {
    log "Verificando se as tabelas foram criadas..."
    
    cd "$PROJECT_ROOT/../database-infrastructure"
    
    # Verificar tabela de contatos
    local contacts_exists=$(docker-compose exec -T postgres psql -U "${POSTGRES_USER:-crm_admin}" -d "${POSTGRES_DB:-crm_juridico}" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'crm' AND table_name = 'contacts');" | tr -d ' \n')
    
    # Verificar tabela de empresas
    local companies_exists=$(docker-compose exec -T postgres psql -U "${POSTGRES_USER:-crm_admin}" -d "${POSTGRES_DB:-crm_juridico}" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'crm' AND table_name = 'companies');" | tr -d ' \n')
    
    if [ "$contacts_exists" = "t" ] && [ "$companies_exists" = "t" ]; then
        success "Tabelas criadas com sucesso!"
        return 0
    else
        error "Falha na criação das tabelas"
        return 1
    fi
}

# Função para mostrar estatísticas
show_stats() {
    log "Estatísticas das tabelas criadas:"
    
    cd "$PROJECT_ROOT/../database-infrastructure"
    
    # Contar registros nas tabelas
    local companies_count=$(docker-compose exec -T postgres psql -U "${POSTGRES_USER:-crm_admin}" -d "${POSTGRES_DB:-crm_juridico}" -t -c "SELECT COUNT(*) FROM crm.companies;" | tr -d ' \n')
    local contacts_count=$(docker-compose exec -T postgres psql -U "${POSTGRES_USER:-crm_admin}" -d "${POSTGRES_DB:-crm_juridico}" -t -c "SELECT COUNT(*) FROM crm.contacts;" | tr -d ' \n')
    
    info "Empresas: $companies_count"
    info "Contatos: $contacts_count"
}

# Função para mostrar próximos passos
show_next_steps() {
    echo ""
    info "Próximos passos:"
    echo "1. Iniciar o projeto de contatos:"
    echo "   cd $PROJECT_ROOT"
    echo "   docker-compose up -d"
    echo ""
    echo "2. Testar a API:"
    echo "   curl http://localhost:3001/health"
    echo ""
    echo "3. Verificar logs:"
    echo "   docker-compose logs -f contatos-api"
    echo ""
}

# Função principal
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              Setup do Banco de Dados - Contatos             ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # Carregar variáveis de ambiente se existirem
    if [ -f "$PROJECT_ROOT/../database-infrastructure/config.env" ]; then
        source "$PROJECT_ROOT/../database-infrastructure/config.env"
        info "Variáveis de ambiente carregadas"
    fi
    
    # Executar script SQL
    execute_sql "$DB_SCRIPT" "Criação das tabelas de contatos e empresas"
    
    # Verificar se as tabelas foram criadas
    if check_tables; then
        show_stats
        show_next_steps
        success "Setup do banco de dados concluído com sucesso! 🎉"
    else
        error "Falha no setup do banco de dados"
        exit 1
    fi
}

# Executar função principal
main "$@"
