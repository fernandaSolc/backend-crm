"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const contactController_1 = require("@/controllers/contactController");
const router = (0, express_1.Router)();
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error) => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined
        }));
        res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            errors: validationErrors
        });
        return;
    }
    next();
};
const createContactValidation = [
    (0, express_validator_1.body)('company_id')
        .isInt({ min: 1 })
        .withMessage('ID da empresa deve ser um número inteiro positivo'),
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Nome deve ter entre 2 e 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
    (0, express_validator_1.body)('type')
        .isIn(['Pessoa', 'Empresa'])
        .withMessage('Tipo deve ser "Pessoa" ou "Empresa"'),
    (0, express_validator_1.body)('phone')
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres')
        .matches(/^[\d\s\(\)\-\+]+$/)
        .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífens e +'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('cpf')
        .optional()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
        .withMessage('CPF deve ter formato válido (000.000.000-00 ou 00000000000)'),
    (0, express_validator_1.body)('cnpj')
        .optional()
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/)
        .withMessage('CNPJ deve ter formato válido (00.000.000/0000-00 ou 00000000000000)'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações devem ter no máximo 1000 caracteres')
];
const updateContactValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('ID do contato deve ser um número inteiro positivo'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Nome deve ter entre 2 e 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['Pessoa', 'Empresa'])
        .withMessage('Tipo deve ser "Pessoa" ou "Empresa"'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage('Telefone deve ter entre 10 e 15 caracteres')
        .matches(/^[\d\s\(\)\-\+]+$/)
        .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífens e +'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email deve ter um formato válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('cpf')
        .optional()
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
        .withMessage('CPF deve ter formato válido (000.000.000-00 ou 00000000000)'),
    (0, express_validator_1.body)('cnpj')
        .optional()
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/)
        .withMessage('CNPJ deve ter formato válido (00.000.000/0000-00 ou 00000000000000)'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações devem ter no máximo 1000 caracteres'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active deve ser um valor booleano')
];
const idValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('ID do contato deve ser um número inteiro positivo')
];
const queryValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número inteiro positivo'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser um número entre 1 e 100'),
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Termo de busca deve ter no máximo 255 caracteres'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(['Pessoa', 'Empresa'])
        .withMessage('Tipo deve ser "Pessoa" ou "Empresa"')
];
router.post('/', createContactValidation, validateRequest, contactController_1.createContact);
router.get('/', queryValidation, validateRequest, contactController_1.getContacts);
router.get('/stats', contactController_1.getContactStats);
router.get('/:id', idValidation, validateRequest, contactController_1.getContactById);
router.put('/:id', updateContactValidation, validateRequest, contactController_1.updateContact);
router.delete('/:id', idValidation, validateRequest, contactController_1.deleteContact);
router.post('/:id/restore', idValidation, validateRequest, contactController_1.restoreContact);
exports.default = router;
//# sourceMappingURL=contactRoutes.js.map