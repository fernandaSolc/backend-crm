"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const logger_1 = __importDefault(require("@/config/logger"));
class Contact {
    constructor(data) {
        this.id = 'id' in data ? data.id : undefined;
        this.company_id = data.company_id;
        this.name = data.name;
        this.type = data.type;
        this.phone = data.phone;
        this.email = data.email;
        this.cpf = data.cpf;
        this.cnpj = data.cnpj;
        this.notes = data.notes;
        this.is_active = 'is_active' in data ? (data.is_active ?? true) : true;
        this.created_at = 'created_at' in data ? data.created_at : undefined;
        this.updated_at = 'updated_at' in data ? data.updated_at : undefined;
        this.created_by = 'created_by' in data ? data.created_by : undefined;
        this.updated_by = 'updated_by' in data ? data.updated_by : undefined;
    }
    validate() {
        const errors = [];
        if (!this.name || this.name.trim().length < 2) {
            errors.push({
                field: 'name',
                message: 'Nome deve ter pelo menos 2 caracteres',
                value: this.name
            });
        }
        if (!this.type || !['Pessoa', 'Empresa'].includes(this.type)) {
            errors.push({
                field: 'type',
                message: 'Tipo deve ser "Pessoa" ou "Empresa"',
                value: this.type
            });
        }
        if (!this.phone || this.phone.trim().length < 10) {
            errors.push({
                field: 'phone',
                message: 'Telefone é obrigatório e deve ter pelo menos 10 dígitos',
                value: this.phone
            });
        }
        if (this.email && !this.isValidEmail(this.email)) {
            errors.push({
                field: 'email',
                message: 'Email deve ter um formato válido',
                value: this.email
            });
        }
        if (this.type === 'Pessoa' && this.cpf && !this.isValidCPF(this.cpf)) {
            errors.push({
                field: 'cpf',
                message: 'CPF deve ter um formato válido',
                value: this.cpf
            });
        }
        if (this.type === 'Empresa' && this.cnpj && !this.isValidCNPJ(this.cnpj)) {
            errors.push({
                field: 'cnpj',
                message: 'CNPJ deve ter um formato válido',
                value: this.cnpj
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    isValidCPF(cpf) {
        const cleanCPF = cpf.replace(/\D/g, '');
        if (cleanCPF.length !== 11)
            return false;
        if (/^(\d)\1{10}$/.test(cleanCPF))
            return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11)
            remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9)))
            return false;
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11)
            remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(10)))
            return false;
        return true;
    }
    isValidCNPJ(cnpj) {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        if (cleanCNPJ.length !== 14)
            return false;
        if (/^(\d)\1{13}$/.test(cleanCNPJ))
            return false;
        let sum = 0;
        let weight = 2;
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cleanCNPJ.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        let remainder = sum % 11;
        const firstDigit = remainder < 2 ? 0 : 11 - remainder;
        if (firstDigit !== parseInt(cleanCNPJ.charAt(12)))
            return false;
        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cleanCNPJ.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        remainder = sum % 11;
        const secondDigit = remainder < 2 ? 0 : 11 - remainder;
        if (secondDigit !== parseInt(cleanCNPJ.charAt(13)))
            return false;
        return true;
    }
    sanitize() {
        return {
            id: this.id,
            company_id: this.company_id,
            name: this.name?.trim() || '',
            type: this.type,
            phone: this.phone?.replace(/\D/g, '') || '',
            email: this.email?.trim().toLowerCase(),
            cpf: this.cpf?.replace(/\D/g, ''),
            cnpj: this.cnpj?.replace(/\D/g, ''),
            notes: this.notes?.trim(),
            is_active: this.is_active,
            created_at: this.created_at,
            updated_at: this.updated_at,
            created_by: this.created_by,
            updated_by: this.updated_by
        };
    }
    toPublic() {
        const sanitized = this.sanitize();
        return {
            id: sanitized.id,
            name: sanitized.name,
            type: sanitized.type,
            phone: this.formatPhone(sanitized.phone),
            email: sanitized.email,
            cpf: sanitized.cpf ? this.formatCPF(sanitized.cpf) : undefined,
            cnpj: sanitized.cnpj ? this.formatCNPJ(sanitized.cnpj) : undefined,
            notes: sanitized.notes,
            is_active: sanitized.is_active ?? true,
            created_at: sanitized.created_at,
            updated_at: sanitized.updated_at
        };
    }
    formatPhone(phone) {
        if (!phone)
            return '';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) {
            return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        else if (clean.length === 10) {
            return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }
    formatCPF(cpf) {
        if (!cpf)
            return '';
        const clean = cpf.replace(/\D/g, '');
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    formatCNPJ(cnpj) {
        if (!cnpj)
            return '';
        const clean = cnpj.replace(/\D/g, '');
        return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    static async create(data, db, userId) {
        const startTime = Date.now();
        try {
            const contact = new Contact(data);
            const validation = contact.validate();
            if (!validation.isValid) {
                throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
            }
            const sanitized = contact.sanitize();
            if (userId) {
                sanitized.created_by = userId;
                sanitized.updated_by = userId;
            }
            const query = `
        INSERT INTO crm.contacts (
          company_id, name, type, phone, email, cpf, cnpj, notes, 
          is_active, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
            const values = [
                sanitized.company_id,
                sanitized.name,
                sanitized.type,
                sanitized.phone,
                sanitized.email,
                sanitized.cpf,
                sanitized.cnpj,
                sanitized.notes,
                sanitized.is_active,
                sanitized.created_by,
                sanitized.updated_by
            ];
            const result = await db.query(query, values);
            const duration = Date.now() - startTime;
            logger_1.default.debug('Database Operation', {
                operation: 'INSERT',
                table: 'contacts',
                duration: `${duration}ms`
            });
            return new Contact(result.rows[0]);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Database Operation Failed', {
                operation: 'INSERT',
                table: 'contacts',
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
    static async findById(id, db) {
        const startTime = Date.now();
        try {
            const query = 'SELECT * FROM crm.contacts WHERE id = $1 AND is_active = true';
            const result = await db.query(query, [id]);
            const duration = Date.now() - startTime;
            logger_1.default.debug('Database Operation', {
                operation: 'SELECT',
                table: 'contacts',
                duration: `${duration}ms`
            });
            return result.rows.length > 0 ? new Contact(result.rows[0]) : null;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Database Operation Failed', {
                operation: 'SELECT',
                table: 'contacts',
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
    static async findByCompany(companyId, db, options = {}) {
        const startTime = Date.now();
        try {
            const { page = 1, limit = 10, search = '', type = '' } = options;
            const offset = (page - 1) * limit;
            let query = `
        SELECT * FROM crm.contacts 
        WHERE company_id = $1 AND is_active = true
      `;
            const values = [companyId];
            let paramCount = 1;
            if (search) {
                paramCount++;
                query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
                values.push(`%${search}%`);
            }
            if (type) {
                paramCount++;
                query += ` AND type = $${paramCount}`;
                values.push(type);
            }
            query += ` ORDER BY name ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            values.push(limit, offset);
            const result = await db.query(query, values);
            const duration = Date.now() - startTime;
            logger_1.default.debug('Database Operation', {
                operation: 'SELECT',
                table: 'contacts',
                duration: `${duration}ms`
            });
            return result.rows.map(row => new Contact(row));
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Database Operation Failed', {
                operation: 'SELECT',
                table: 'contacts',
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
    static async countByCompany(companyId, db, options = {}) {
        const startTime = Date.now();
        try {
            const { search = '', type = '' } = options;
            let query = `
        SELECT COUNT(*) as total FROM crm.contacts 
        WHERE company_id = $1 AND is_active = true
      `;
            const values = [companyId];
            let paramCount = 1;
            if (search) {
                paramCount++;
                query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
                values.push(`%${search}%`);
            }
            if (type) {
                paramCount++;
                query += ` AND type = $${paramCount}`;
                values.push(type);
            }
            const result = await db.query(query, values);
            const duration = Date.now() - startTime;
            logger_1.default.debug('Database Operation', {
                operation: 'SELECT',
                table: 'contacts',
                duration: `${duration}ms`
            });
            return parseInt(result.rows[0].total);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Database Operation Failed', {
                operation: 'SELECT',
                table: 'contacts',
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
    async update(data, db, userId) {
        const startTime = Date.now();
        try {
            Object.assign(this, data);
            const validation = this.validate();
            if (!validation.isValid) {
                throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
            }
            const sanitized = this.sanitize();
            if (userId) {
                sanitized.updated_by = userId;
            }
            const query = `
        UPDATE crm.contacts SET
          name = $2, type = $3, phone = $4, email = $5, cpf = $6, cnpj = $7,
          notes = $8, is_active = $9, updated_by = $10, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
            const values = [
                this.id,
                sanitized.name,
                sanitized.type,
                sanitized.phone,
                sanitized.email,
                sanitized.cpf,
                sanitized.cnpj,
                sanitized.notes,
                sanitized.is_active,
                sanitized.updated_by
            ];
            const result = await db.query(query, values);
            const duration = Date.now() - startTime;
            logger_1.default.debug('Database Operation', {
                operation: 'UPDATE',
                table: 'contacts',
                duration: `${duration}ms`
            });
            if (result.rows.length === 0) {
                throw new Error('Contato não encontrado');
            }
            Object.assign(this, result.rows[0]);
            return this;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Database Operation Failed', {
                operation: 'UPDATE',
                table: 'contacts',
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
    async delete(db, userId) {
        const startTime = Date.now();
        try {
            const query = `
        UPDATE crm.contacts SET
          is_active = false, updated_by = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
            const result = await db.query(query, [this.id, userId]);
            const duration = Date.now() - startTime;
            logger_1.default.debug('Database Operation', {
                operation: 'DELETE',
                table: 'contacts',
                duration: `${duration}ms`
            });
            if (result.rows.length === 0) {
                throw new Error('Contato não encontrado');
            }
            Object.assign(this, result.rows[0]);
            return this;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Database Operation Failed', {
                operation: 'DELETE',
                table: 'contacts',
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
}
exports.Contact = Contact;
exports.default = Contact;
//# sourceMappingURL=Contact.js.map