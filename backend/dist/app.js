"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_1 = __importDefault(require("xss"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("@/config/database");
const logger_1 = __importStar(require("@/config/logger"));
const errorHandler_1 = require("@/middleware/errorHandler");
const auth_1 = require("@/middleware/auth");
const contactRoutes_1 = __importDefault(require("@/routes/contactRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT || '100'),
    message: {
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('Rate limit excedido', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
        });
        res.status(429).json({
            success: false,
            error: 'Muitas tentativas. Tente novamente em alguns minutos.'
        });
    }
});
app.use(limiter);
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: logger_1.stream }));
app.use((req, _res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    if (req.path.includes('/auth') || req.path.includes('/login')) {
        logger_1.default.info('Tentativa de autenticação', {
            ip,
            userAgent,
            path: req.path,
            method: req.method
        });
    }
    next();
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, express_mongo_sanitize_1.default)());
app.use((req, _res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string')
            return (0, xss_1.default)(obj);
        if (Array.isArray(obj))
            return obj.map(sanitize);
        if (obj && typeof obj === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(obj))
                out[k] = sanitize(v);
            return out;
        }
        return obj;
    };
    if (req.body)
        req.body = sanitize(req.body);
    if (req.query)
        req.query = sanitize(req.query);
    if (req.params)
        req.params = sanitize(req.params);
    next();
});
app.use(database_1.injectDatabase);
app.use(errorHandler_1.jsonErrorHandler);
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API funcionando corretamente',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
app.get('/api/info', (_req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Contatos CRM API',
            version: process.env.npm_package_version || '1.0.0',
            description: 'API REST para gerenciamento de contatos do CRM Jurídico',
            environment: process.env.NODE_ENV || 'development',
            endpoints: {
                contacts: '/api/contacts',
                health: '/health',
                info: '/api/info'
            }
        }
    });
});
app.use('/api/contacts', auth_1.authenticateToken, contactRoutes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            throw new Error('Falha ao conectar com o banco de dados');
        }
        const port = process.env.PORT || 3001;
        const server = app.listen(port, () => {
            logger_1.default.info(`Servidor iniciado na porta ${port}`);
            logger_1.default.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
            logger_1.default.info(`Health check: http://localhost:${port}/health`);
        });
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`Recebido sinal ${signal}. Iniciando shutdown graceful...`);
            server.close(async () => {
                logger_1.default.info('Servidor HTTP fechado');
                try {
                    await (0, database_1.closePool)();
                    logger_1.default.info('Conexões com banco de dados fechadas');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.default.error('Erro durante shutdown:', error);
                    process.exit(1);
                }
            });
            setTimeout(() => {
                logger_1.default.error('Forçando shutdown após timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Erro não capturado:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Promise rejeitada não tratada:', { reason, promise });
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=app.js.map