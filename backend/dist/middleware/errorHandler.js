"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConflictError = exports.createForbiddenError = exports.createUnauthorizedError = exports.createNotFoundError = exports.createValidationError = exports.createError = exports.rateLimitErrorHandler = exports.uploadErrorHandler = exports.jsonErrorHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("@/config/logger"));
const types_1 = require("@/types");
const errorHandler = (error, req, res, _next) => {
    let statusCode = 500;
    let message = 'Erro interno do servidor';
    logger_1.default.error('Erro capturado pelo middleware', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
    });
    if (error instanceof types_1.AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Dados inválidos';
    }
    else if (error.name === 'UniqueViolationError') {
        statusCode = 409;
        message = 'Dados já existem no sistema';
    }
    else if (error.name === 'ForeignKeyViolationError') {
        statusCode = 400;
        message = 'Referência inválida';
    }
    else if (error.name === 'ConnectionError' || error.message.includes('ECONNREFUSED')) {
        statusCode = 503;
        message = 'Serviço temporariamente indisponível';
    }
    else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        statusCode = 408;
        message = 'Tempo limite excedido';
    }
    else if (error.message.includes('syntax error')) {
        statusCode = 500;
        message = 'Erro interno do servidor';
        logger_1.default.error('Erro de sintaxe SQL', { error: error.message });
    }
    const response = {
        success: false,
        error: message
    };
    if (process.env.NODE_ENV === 'development') {
        response.error = error.message;
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, _next) => {
    const response = {
        success: false,
        error: `Rota ${req.method} ${req.path} não encontrada`
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
const jsonErrorHandler = (error, _req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
        const response = {
            success: false,
            error: 'JSON inválido'
        };
        res.status(400).json(response);
    }
    else {
        next(error);
    }
};
exports.jsonErrorHandler = jsonErrorHandler;
const uploadErrorHandler = (error, _req, res, next) => {
    if (error.message.includes('File too large')) {
        const response = {
            success: false,
            error: 'Arquivo muito grande'
        };
        res.status(413).json(response);
    }
    else if (error.message.includes('Unexpected field')) {
        const response = {
            success: false,
            error: 'Campo de arquivo inesperado'
        };
        res.status(400).json(response);
    }
    else {
        next(error);
    }
};
exports.uploadErrorHandler = uploadErrorHandler;
const rateLimitErrorHandler = (_req, res, _next) => {
    const response = {
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    };
    res.status(429).json(response);
};
exports.rateLimitErrorHandler = rateLimitErrorHandler;
const createError = (message, statusCode = 500) => {
    return new types_1.AppError(message, statusCode);
};
exports.createError = createError;
const createValidationError = (errors) => {
    const error = new types_1.AppError('Dados inválidos', 400);
    error.errors = errors;
    return error;
};
exports.createValidationError = createValidationError;
const createNotFoundError = (resource = 'Recurso') => {
    return new types_1.AppError(`${resource} não encontrado`, 404);
};
exports.createNotFoundError = createNotFoundError;
const createUnauthorizedError = (message = 'Não autorizado') => {
    return new types_1.AppError(message, 401);
};
exports.createUnauthorizedError = createUnauthorizedError;
const createForbiddenError = (message = 'Acesso negado') => {
    return new types_1.AppError(message, 403);
};
exports.createForbiddenError = createForbiddenError;
const createConflictError = (message = 'Conflito de dados') => {
    return new types_1.AppError(message, 409);
};
exports.createConflictError = createConflictError;
//# sourceMappingURL=errorHandler.js.map