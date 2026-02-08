import { Response, NextFunction } from 'express';
import Contact from '@/models/Contact';
import logger from '@/config/logger';
import {
    RequestWithUser,
    ApiResponse,
    ContactCreateInput,
    ContactUpdateInput,
    PaginatedResponse,
    ContactPublic,
    PaginationOptionsWithFilters,
    NotFoundError
} from '@/types';

// POST /contacts - Criar novo contato
export const createContact = async (
    req: RequestWithUser,
    res: Response<ApiResponse<ContactPublic>>,
    next: NextFunction
): Promise<void> => {
    try {
        const { company_id, name, type, phone, email, cpf, cnpj, notes }: ContactCreateInput = req.body;
        const userId = req.user?.userId;

        // Validar se o company_id corresponde ao do usuário logado
        if (company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: company_id não corresponde ao usuário logado'
            });
            return;
        }

        const contactData: ContactCreateInput = {
            company_id,
            name,
            type,
            phone,
            email: email || undefined,
            cpf: cpf || undefined,
            cnpj: cnpj || undefined,
            notes: notes || undefined
        };

        const contact = await Contact.create(contactData, req.db!, userId);
        const publicContact = contact.toPublic();

        logger.info('Contato criado com sucesso', {
            contactId: contact.id,
            companyId: company_id,
            userId
        });

        res.status(201).json({
            success: true,
            data: publicContact,
            message: 'Contato criado com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao criar contato', error);
        next(error);
    }
};

// GET /contacts - Listar contatos com paginação
export const getContacts = async (
    req: RequestWithUser,
    res: Response<ApiResponse<PaginatedResponse<ContactPublic>>>,
    next: NextFunction
): Promise<void> => {
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

        const paginationOptions: PaginationOptionsWithFilters = {
            page: parseInt(page as string) || 1,
            limit: Math.min(parseInt(limit as string) || 10, 100), // Máximo 100 por página
            search: search as string,
            type: type as 'Pessoa' | 'Empresa' || undefined
        };

        const [contacts, total] = await Promise.all([
            Contact.findByCompany(companyId, req.db!, paginationOptions),
            Contact.countByCompany(companyId, req.db!, paginationOptions)
        ]);

        const totalPages = Math.ceil(total / paginationOptions.limit!);
        const hasNext = paginationOptions.page! < totalPages;
        const hasPrev = paginationOptions.page! > 1;

        const publicContacts = contacts.map(contact => contact.toPublic());

        const response: PaginatedResponse<ContactPublic> = {
            data: publicContacts,
            pagination: {
                page: paginationOptions.page!,
                limit: paginationOptions.limit!,
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
    } catch (error) {
        logger.error('Erro ao listar contatos', error);
        next(error);
    }
};

// GET /contacts/:id - Obter contato específico
export const getContactById = async (
    req: RequestWithUser,
    res: Response<ApiResponse<ContactPublic>>,
    next: NextFunction
): Promise<void> => {
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

        const contact = await Contact.findById(contactId, req.db!);

        if (!contact) {
            throw new NotFoundError('Contato');
        }

        // Verificar se o contato pertence à empresa do usuário
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
    } catch (error) {
        logger.error('Erro ao obter contato', error);
        next(error);
    }
};

// PUT /contacts/:id - Atualizar contato
export const updateContact = async (
    req: RequestWithUser,
    res: Response<ApiResponse<ContactPublic>>,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const contactId = parseInt(id);
        const updateData: ContactUpdateInput = req.body;
        const userId = req.user?.userId;

        if (isNaN(contactId)) {
            res.status(400).json({
                success: false,
                error: 'ID do contato deve ser um número válido'
            });
            return;
        }

        const contact = await Contact.findById(contactId, req.db!);

        if (!contact) {
            throw new NotFoundError('Contato');
        }

        // Verificar se o contato pertence à empresa do usuário
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }

        const updatedContact = await contact.update(updateData, req.db!, userId);
        const publicContact = updatedContact.toPublic();

        logger.info('Contato atualizado com sucesso', {
            contactId: contact.id,
            companyId: contact.company_id,
            userId
        });

        res.json({
            success: true,
            data: publicContact,
            message: 'Contato atualizado com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao atualizar contato', error);
        next(error);
    }
};

// DELETE /contacts/:id - Excluir contato (soft delete)
export const deleteContact = async (
    req: RequestWithUser,
    res: Response<ApiResponse<{ id: number }>>,
    next: NextFunction
): Promise<void> => {
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

        const contact = await Contact.findById(contactId, req.db!);

        if (!contact) {
            throw new NotFoundError('Contato');
        }

        // Verificar se o contato pertence à empresa do usuário
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }

        await contact.delete(req.db!, userId);

        logger.info('Contato excluído com sucesso', {
            contactId: contact.id,
            companyId: contact.company_id,
            userId
        });

        res.json({
            success: true,
            data: { id: contactId },
            message: 'Contato excluído com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao excluir contato', error);
        next(error);
    }
};

// GET /contacts/stats - Estatísticas dos contatos
export const getContactStats = async (
    req: RequestWithUser,
    res: Response<ApiResponse<any>>,
    next: NextFunction
): Promise<void> => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
            return;
        }

        // Buscar estatísticas
        const [totalContacts, pessoaContacts, empresaContacts, activeContacts, recentContacts] = await Promise.all([
            Contact.countByCompany(companyId, req.db!),
            Contact.countByCompany(companyId, req.db!, { type: 'Pessoa' }),
            Contact.countByCompany(companyId, req.db!, { type: 'Empresa' }),
            Contact.countByCompany(companyId, req.db!, { is_active: true }),
            // Contatos dos últimos 30 dias
            req.db!.query(`
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
    } catch (error) {
        logger.error('Erro ao obter estatísticas', error);
        next(error);
    }
};

// POST /contacts/:id/restore - Restaurar contato excluído
export const restoreContact = async (
    req: RequestWithUser,
    res: Response<ApiResponse<ContactPublic>>,
    next: NextFunction
): Promise<void> => {
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

        // Buscar contato (incluindo inativos)
        const query = 'SELECT * FROM crm.contacts WHERE id = $1';
        const result = await req.db!.query(query, [contactId]);

        if (result.rows.length === 0) {
            throw new NotFoundError('Contato');
        }

        const contact = new Contact(result.rows[0]);

        // Verificar se o contato pertence à empresa do usuário
        if (contact.company_id !== req.user?.companyId) {
            res.status(403).json({
                success: false,
                error: 'Acesso negado: contato não pertence à sua empresa'
            });
            return;
        }

        // Restaurar contato
        const restoreQuery = `
      UPDATE crm.contacts SET
        is_active = true, updated_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

        const restoreResult = await req.db!.query(restoreQuery, [contactId, userId]);
        const restoredContact = new Contact(restoreResult.rows[0]);
        const publicContact = restoredContact.toPublic();

        logger.info('Contato restaurado com sucesso', {
            contactId: contact.id,
            companyId: contact.company_id,
            userId
        });

        res.json({
            success: true,
            data: publicContact,
            message: 'Contato restaurado com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao restaurar contato', error);
        next(error);
    }
};
