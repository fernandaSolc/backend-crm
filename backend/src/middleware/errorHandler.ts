import { Response, NextFunction } from 'express';
import logger from '@/config/logger';
import { ApiResponse, AppError } from '@/types';

// Middleware de tratamento de erros
export const errorHandler = (
    error: Error,
    req: any,
    res: Response<ApiResponse>,
    _next: NextFunction
): void => {
    let statusCode = 500;
    let message = 'Erro interno do servidor';

    // Log do erro
    logger.error('Erro capturado pelo middleware', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id || 'anonymous'
    });

    // Erro customizado da aplicação
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        // isOperational = error.isOperational;
    }
    // Erro de validação do PostgreSQL
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Dados inválidos';
    }
    // Erro de chave única violada
    else if (error.name === 'UniqueViolationError') {
        statusCode = 409;
        message = 'Dados já existem no sistema';
    }
    // Erro de chave estrangeira violada
    else if (error.name === 'ForeignKeyViolationError') {
        statusCode = 400;
        message = 'Referência inválida';
    }
    // Erro de conexão com banco
    else if (error.name === 'ConnectionError' || error.message.includes('ECONNREFUSED')) {
        statusCode = 503;
        message = 'Serviço temporariamente indisponível';
    }
    // Erro de timeout
    else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        statusCode = 408;
        message = 'Tempo limite excedido';
    }
    // Erro de sintaxe SQL
    else if (error.message.includes('syntax error')) {
        statusCode = 500;
        message = 'Erro interno do servidor';
        logger.error('Erro de sintaxe SQL', { error: error.message });
    }

    // Resposta de erro
    const response: ApiResponse = {
        success: false,
        error: message
    };

    // Em desenvolvimento, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        response.error = error.message;
        (response as any).stack = error.stack;
    }

    res.status(statusCode).json(response);
};

// Middleware para capturar rotas não encontradas
export const notFoundHandler = (
    req: any,
    res: Response<ApiResponse>,
    _next: NextFunction
): void => {
    const response: ApiResponse = {
        success: false,
        error: `Rota ${req.method} ${req.path} não encontrada`
    };

    res.status(404).json(response);
};

// Middleware para capturar erros de parsing JSON
export const jsonErrorHandler = (
    error: Error,
    _req: any,
    res: Response<ApiResponse>,
    next: NextFunction
): void => {
    if (error instanceof SyntaxError && 'body' in error) {
        const response: ApiResponse = {
            success: false,
            error: 'JSON inválido'
        };
        res.status(400).json(response);
    } else {
        next(error);
    }
};

// Middleware para capturar erros de upload
export const uploadErrorHandler = (
    error: Error,
    _req: any,
    res: Response<ApiResponse>,
    next: NextFunction
): void => {
    if (error.message.includes('File too large')) {
        const response: ApiResponse = {
            success: false,
            error: 'Arquivo muito grande'
        };
        res.status(413).json(response);
    } else if (error.message.includes('Unexpected field')) {
        const response: ApiResponse = {
            success: false,
            error: 'Campo de arquivo inesperado'
        };
        res.status(400).json(response);
    } else {
        next(error);
    }
};

// Middleware para capturar erros de rate limiting
export const rateLimitErrorHandler = (
    _req: any,
    res: Response<ApiResponse>,
    _next: NextFunction
): void => {
    const response: ApiResponse = {
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    };
    res.status(429).json(response);
};

// Função para criar erro customizado
export const createError = (message: string, statusCode: number = 500): AppError => {
    return new AppError(message, statusCode);
};

// Função para criar erro de validação
export const createValidationError = (errors: any[]): AppError => {
    const error = new AppError('Dados inválidos', 400);
    (error as any).errors = errors;
    return error;
};

// Função para criar erro de não encontrado
export const createNotFoundError = (resource: string = 'Recurso'): AppError => {
    return new AppError(`${resource} não encontrado`, 404);
};

// Função para criar erro de não autorizado
export const createUnauthorizedError = (message: string = 'Não autorizado'): AppError => {
    return new AppError(message, 401);
};

// Função para criar erro de acesso negado
export const createForbiddenError = (message: string = 'Acesso negado'): AppError => {
    return new AppError(message, 403);
};

// Função para criar erro de conflito
export const createConflictError = (message: string = 'Conflito de dados'): AppError => {
    return new AppError(message, 409);
};
