"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.logCustom = exports.logSecurity = exports.logDatabase = exports.logError = exports.logRequest = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint()),
    defaultMeta: {
        service: 'contatos-crm-api',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            }))
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        })
    ],
    ...(process.env.NODE_ENV === 'development' && {
        transports: [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ]
    })
});
const stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};
exports.stream = stream;
const logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || 'anonymous'
    };
    if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
    }
    else {
        logger.info('HTTP Request', logData);
    }
};
exports.logRequest = logRequest;
const logError = (error, req) => {
    const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(req && {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous'
        })
    };
    logger.error('Application Error', errorData);
};
exports.logError = logError;
const logDatabase = (operation, table, duration, error) => {
    const logData = {
        operation,
        table,
        duration: `${duration}ms`,
        ...(error && { error: error.message })
    };
    if (error) {
        logger.error('Database Operation Failed', logData);
    }
    else {
        logger.debug('Database Operation', logData);
    }
};
exports.logDatabase = logDatabase;
const logSecurity = (event, details) => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};
exports.logSecurity = logSecurity;
const logCustom = (level, message, meta) => {
    logger.log(level, message, meta);
};
exports.logCustom = logCustom;
exports.default = logger;
//# sourceMappingURL=logger.js.map