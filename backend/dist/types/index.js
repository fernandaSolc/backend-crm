"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(errors, message = 'Dados inválidos') {
        super(message, 400);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource = 'Recurso') {
        super(`${resource} não encontrado`, 404);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = 'Conflito de dados') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=index.js.map