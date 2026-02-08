import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
    getContactStats,
    restoreContact
} from '@/controllers/contactController';
import { Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

const router = Router();

// Middleware para validar resultados da validação
const validateRequest = (req: any, res: Response<ApiResponse>, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error: any) => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? (error as any).value : undefined
        }));
        res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            errors: validationErrors
        } as ApiResponse);
        return;
    }
    next();
};

// Validações para criação de contato
const createContactValidation = [
    body('company_id')
        .isInt({ min: 1 })
        .withMessage('ID da empresa deve ser um número inteiro positivo'),

    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Nome deve ter entre 2 e 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),

    body('type')
        .isIn(['Pessoa', 'Empresa'])
        .withMessage('Tipo deve ser "Pessoa" ou "Empresa"'),

    body('phone')
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres')
        .matches(/^[\d\s\(\)\-\+]+$/)
        .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífens e +'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),

    body('cpf')
        .optional()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
        .withMessage('CPF deve ter formato válido (000.000.000-00 ou 00000000000)'),

    body('cnpj')
        .optional()
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/)
        .withMessage('CNPJ deve ter formato válido (00.000.000/0000-00 ou 00000000000000)'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações devem ter no máximo 1000 caracteres')
];

// Validações para atualização de contato
const updateContactValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID do contato deve ser um número inteiro positivo'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Nome deve ter entre 2 e 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),

    body('type')
        .optional()
        .isIn(['Pessoa', 'Empresa'])
        .withMessage('Tipo deve ser "Pessoa" ou "Empresa"'),

    body('phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres')
        .matches(/^[\d\s\(\)\-\+]+$/)
        .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífens e +'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),

    body('cpf')
        .optional()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
        .withMessage('CPF deve ter formato válido (000.000.000-00 ou 00000000000)'),

    body('cnpj')
        .optional()
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/)
        .withMessage('CNPJ deve ter formato válido (00.000.000/0000-00 ou 00000000000000)'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações devem ter no máximo 1000 caracteres'),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active deve ser um valor booleano')
];

// Validações para parâmetros de ID
const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID do contato deve ser um número inteiro positivo')
];

// Validações para query parameters
const queryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número inteiro positivo'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser um número entre 1 e 100'),

    query('search')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Termo de busca deve ter no máximo 255 caracteres'),

    query('type')
        .optional()
        .isIn(['Pessoa', 'Empresa'])
        .withMessage('Tipo deve ser "Pessoa" ou "Empresa"')
];

// Rotas
router.post(
    '/',
    createContactValidation,
    validateRequest,
    createContact
);

router.get(
    '/',
    queryValidation,
    validateRequest,
    getContacts
);

router.get(
    '/stats',
    getContactStats
);

router.get(
    '/:id',
    idValidation,
    validateRequest,
    getContactById
);

router.put(
    '/:id',
    updateContactValidation,
    validateRequest,
    updateContact
);

router.delete(
    '/:id',
    idValidation,
    validateRequest,
    deleteContact
);

router.post(
    '/:id/restore',
    idValidation,
    validateRequest,
    restoreContact
);

export default router;
