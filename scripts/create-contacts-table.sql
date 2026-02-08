-- Script para criar tabela de contatos no banco centralizado
-- =========================================================

-- Criar tabela de empresas (se não existir)
CREATE TABLE IF NOT EXISTS crm.companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by INTEGER,
    updated_by INTEGER
);

-- Criar tabela de contatos
CREATE TABLE IF NOT EXISTS crm.contacts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES crm.companies(id) ON DELETE CASCADE,
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON crm.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON crm.contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON crm.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON crm.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON crm.contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON crm.contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON crm.contacts(created_at);

-- Criar índices para empresas
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON crm.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_name ON crm.companies(name);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON crm.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON crm.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers de auditoria
CREATE TRIGGER audit_contacts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON crm.contacts
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_companies_trigger
    AFTER INSERT OR UPDATE OR DELETE ON crm.companies
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Configurar Row Level Security
ALTER TABLE crm.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.companies ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para contatos
CREATE POLICY contacts_select_policy ON crm.contacts
    FOR SELECT TO crm_app_user
    USING (true);

CREATE POLICY contacts_insert_policy ON crm.contacts
    FOR INSERT TO crm_app_user
    WITH CHECK (true);

CREATE POLICY contacts_update_policy ON crm.contacts
    FOR UPDATE TO crm_app_user
    USING (true)
    WITH CHECK (true);

CREATE POLICY contacts_delete_policy ON crm.contacts
    FOR DELETE TO crm_app_user
    USING (true);

-- Políticas de segurança para empresas
CREATE POLICY companies_select_policy ON crm.companies
    FOR SELECT TO crm_app_user
    USING (true);

CREATE POLICY companies_insert_policy ON crm.companies
    FOR INSERT TO crm_app_user
    WITH CHECK (true);

CREATE POLICY companies_update_policy ON crm.companies
    FOR UPDATE TO crm_app_user
    USING (true)
    WITH CHECK (true);

CREATE POLICY companies_delete_policy ON crm.companies
    FOR DELETE TO crm_app_user
    USING (true);

-- Políticas para usuário readonly
CREATE POLICY contacts_readonly_policy ON crm.contacts
    FOR SELECT TO crm_readonly_user
    USING (true);

CREATE POLICY companies_readonly_policy ON crm.companies
    FOR SELECT TO crm_readonly_user
    USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON crm.contacts TO crm_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm.companies TO crm_app_user;
GRANT SELECT ON crm.contacts TO crm_readonly_user;
GRANT SELECT ON crm.companies TO crm_readonly_user;

-- Conceder permissões nas sequências
GRANT USAGE, SELECT ON SEQUENCE crm.contacts_id_seq TO crm_app_user;
GRANT USAGE, SELECT ON SEQUENCE crm.companies_id_seq TO crm_app_user;

-- Inserir empresa de exemplo (para testes)
INSERT INTO crm.companies (name, cnpj, email, phone, address) 
VALUES ('Empresa Exemplo Ltda', '12.345.678/0001-90', 'contato@exemplo.com', '(11) 99999-9999', 'Rua Exemplo, 123 - São Paulo/SP')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir contato de exemplo (para testes)
INSERT INTO crm.contacts (company_id, name, type, phone, email, notes)
SELECT 
    c.id,
    'João Silva',
    'Pessoa',
    '(11) 99999-8888',
    'joao.silva@exemplo.com',
    'Cliente VIP - Contato principal'
FROM crm.companies c 
WHERE c.cnpj = '12.345.678/0001-90'
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE crm.contacts IS 'Tabela de contatos do CRM';
COMMENT ON TABLE crm.companies IS 'Tabela de empresas do CRM';

COMMENT ON COLUMN crm.contacts.id IS 'Identificador único do contato';
COMMENT ON COLUMN crm.contacts.company_id IS 'ID da empresa proprietária do contato';
COMMENT ON COLUMN crm.contacts.name IS 'Nome do contato';
COMMENT ON COLUMN crm.contacts.type IS 'Tipo do contato: Pessoa ou Empresa';
COMMENT ON COLUMN crm.contacts.phone IS 'Telefone/WhatsApp do contato';
COMMENT ON COLUMN crm.contacts.email IS 'Email do contato';
COMMENT ON COLUMN crm.contacts.cpf IS 'CPF (apenas para pessoa física)';
COMMENT ON COLUMN crm.contacts.cnpj IS 'CNPJ (apenas para pessoa jurídica)';
COMMENT ON COLUMN crm.contacts.notes IS 'Observações sobre o contato';
COMMENT ON COLUMN crm.contacts.is_active IS 'Indica se o contato está ativo';
COMMENT ON COLUMN crm.contacts.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN crm.contacts.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN crm.contacts.created_by IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN crm.contacts.updated_by IS 'ID do usuário que atualizou o registro';
