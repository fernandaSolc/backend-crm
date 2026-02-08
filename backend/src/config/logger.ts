import winston from 'winston';
import path from 'path';
import { LogLevel } from '@/types';
import { Request, Response } from 'express';

// Interface para stream do Morgan
interface MorganStream {
    write: (message: string) => void;
}

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.prettyPrint()
    ),
    defaultMeta: {
        service: 'contatos-crm-api',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                })
            )
        }),

        // File transport para logs de erro
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),

        // File transport para todos os logs
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],

    // Configuração para desenvolvimento
    ...(process.env.NODE_ENV === 'development' && {
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ]
    })
});

// Stream para Morgan (HTTP request logging)
const stream: MorganStream = {
    write: (message: string): void => {
        logger.info(message.trim());
    }
};

// Função para log de requisições HTTP
export const logRequest = (req: Request, res: Response, responseTime: number): void => {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: (req as any).user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
    } else {
        logger.info('HTTP Request', logData);
    }
};

// Função para log de erros
export const logError = (error: Error, req?: Request): void => {
    const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(req && {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: (req as any).user?.id || 'anonymous'
        })
    };

    logger.error('Application Error', errorData);
};

// Função para log de operações de banco de dados
export const logDatabase = (
    operation: string,
    table: string,
    duration: number,
    error?: Error
): void => {
    const logData = {
        operation,
        table,
        duration: `${duration}ms`,
        ...(error && { error: error.message })
    };

    if (error) {
        logger.error('Database Operation Failed', logData);
    } else {
        logger.debug('Database Operation', logData);
    }
};

// Função para log de segurança
export const logSecurity = (event: string, details: Record<string, any>): void => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};

// Função para log customizado
export const logCustom = (level: keyof LogLevel, message: string, meta?: Record<string, any>): void => {
    logger.log(level, message, meta);
};

export { stream };
export default logger;
