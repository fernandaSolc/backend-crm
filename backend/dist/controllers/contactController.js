"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreContact = exports.getContactStats = exports.deleteContact = exports.updateContact = exports.getContactById = exports.getContacts = exports.createContact = void 0;
const Contact_1 = __importDefault(require("@/models/Contact"));
const logger_1 = __importDefault(require("@/config/logger"));
const types_1 = require("@/types");
const createContact = async (req, res, next) => {
    try {
        const { company_id, name, type, phone, email, cpf, cnpj, notes } = req.body;
        const userId = req.user?.userId;
        if (company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: company_id não corresponde ao usuário logado'
            });
            return;
        }
        const contactData = {
            company_id,
            name,
            type,
            phone,
            email: email || undefined,
            cpf: cpf || undefined,
            cnpj: cnpj || undefined,
            notes: notes || undefined
        };
        const contact = await Contact_1.default.create(contactData, req.db, userId);
        const publicContact = contact.toPublic();
        logger_1.default.info('Contato criado com sucesso', {
            contactId: contact.id,
            companyId: company_id,
            userId
        });
        res.status(201).json({
            success: true,
            data: publicContact,
            message: 'Contato criado com sucesso'
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao criar contato', error);
        next(error);
    }
};
exports.createContact = createContact;
const getContacts = async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
            return;
        }
        const { page = 1, limit = 10, search = '', type = '' } = req.query;
        const paginationOptions = {
            page: parseInt(page) || 1,
            limit: Math.min(parseInt(limit) || 10, 100),
            search: search,
            type: type || undefined
        };
        const [contacts, total] = await Promise.all([
            Contact_1.default.findByCompany(companyId, req.db, paginationOptions),
            Contact_1.default.countByCompany(companyId, req.db, paginationOptions)
        ]);
        const totalPages = Math.ceil(total / paginationOptions.limit);
        const hasNext = paginationOptions.page < totalPages;
        const hasPrev = paginationOptions.page > 1;
        const publicContacts = contacts.map(contact => contact.toPublic());
        const response = {
            data: publicContacts,
            pagination: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                total,
                totalPages,
                hasNext,
                hasPrev
            }
        };
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao listar contatos', error);
        next(error);
    }
};
exports.getContacts = getContacts;
const getContactById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contactId = parseInt(id);
        if (isNaN(contactId)) {
            res.status(400).json({
                success: false,
                error: 'ID do contato deve ser um número válido'
            });
            return;
        }
        const contact = await Contact_1.default.findById(contactId, req.db);
        if (!contact) {
            throw new types_1.NotFoundError('Contato');
        }
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }
        const publicContact = contact.toPublic();
        res.json({
            success: true,
            data: publicContact
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao obter contato', error);
        next(error);
    }
};
exports.getContactById = getContactById;
const updateContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contactId = parseInt(id);
        const updateData = req.body;
        const userId = req.user?.userId;
        if (isNaN(contactId)) {
            res.status(400).json({
                success: false,
                error: 'ID do contato deve ser um número válido'
            });
            return;
        }
        const contact = await Contact_1.default.findById(contactId, req.db);
        if (!contact) {
            throw new types_1.NotFoundError('Contato');
        }
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }
        const updatedContact = await contact.update(updateData, req.db, userId);
        const publicContact = updatedContact.toPublic();
        logger_1.default.info('Contato atualizado com sucesso', {
            contactId: contact.id,
            companyId: contact.company_id,
            userId
        });
        res.json({
            success: true,
            data: publicContact,
            message: 'Contato atualizado com sucesso'
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar contato', error);
        next(error);
    }
};
exports.updateContact = updateContact;
const deleteContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contactId = parseInt(id);
        const userId = req.user?.userId;
        if (isNaN(contactId)) {
            res.status(400).json({
                success: false,
                error: 'ID do contato deve ser um número válido'
            });
            return;
        }
        const contact = await Contact_1.default.findById(contactId, req.db);
        if (!contact) {
            throw new types_1.NotFoundError('Contato');
        }
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }
        await contact.delete(req.db, userId);
        logger_1.default.info('Contato excluído com sucesso', {
            contactId: contact.id,
            companyId: contact.company_id,
            userId
        });
        res.json({
            success: true,
            data: { id: contactId },
            message: 'Contato excluído com sucesso'
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao excluir contato', error);
        next(error);
    }
};
exports.deleteContact = deleteContact;
const getContactStats = async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
            return;
        }
        const [totalContacts, pessoaContacts, empresaContacts, activeContacts, recentContacts] = await Promise.all([
            Contact_1.default.countByCompany(companyId, req.db),
            Contact_1.default.countByCompany(companyId, req.db, { type: 'Pessoa' }),
            Contact_1.default.countByCompany(companyId, req.db, { type: 'Empresa' }),
            Contact_1.default.countByCompany(companyId, req.db, { is_active: true }),
            req.db.query(`
        SELECT COUNT(*) as count FROM crm.contacts 
        WHERE company_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      `, [companyId])
        ]);
        const stats = {
            total: totalContacts,
            byType: {
                Pessoa: pessoaContacts,
                Empresa: empresaContacts
            },
            byStatus: {
                active: activeContacts,
                inactive: totalContacts - activeContacts
            },
            recent: parseInt(recentContacts.rows[0].count)
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao obter estatísticas', error);
        next(error);
    }
};
exports.getContactStats = getContactStats;
const restoreContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contactId = parseInt(id);
        const userId = req.user?.userId;
        if (isNaN(contactId)) {
            res.status(400).json({
                success: false,
                error: 'ID do contato deve ser um número válido'
            });
            return;
        }
        const query = 'SELECT * FROM crm.contacts WHERE id = $1';
        const result = await req.db.query(query, [contactId]);
        if (result.rows.length === 0) {
            throw new types_1.NotFoundError('Contato');
        }
        const contact = new Contact_1.default(result.rows[0]);
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }
        const restoreQuery = `
      UPDATE crm.contacts SET
        is_active = true, updated_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const restoreResult = await req.db.query(restoreQuery, [contactId, userId]);
        const restoredContact = new Contact_1.default(restoreResult.rows[0]);
        const publicContact = restoredContact.toPublic();
        logger_1.default.info('Contato restaurado com sucesso', {
            contactId: contact.id,
            companyId: contact.company_id,
            userId
        });
        res.json({
            success: true,
            data: publicContact,
            message: 'Contato restaurado com sucesso'
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao restaurar contato', error);
        next(error);
    }
};
exports.restoreContact = restoreContact;
//# sourceMappingURL=contactController.js.map