import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar configurações
import { testConnection, injectDatabase, closePool } from '@/config/database';
import logger, { stream } from '@/config/logger';

// Importar middlewares
import { errorHandler, notFoundHandler, jsonErrorHandler } from '@/middleware/errorHandler';
import { authenticateToken } from '@/middleware/auth';

// Importar rotas
import contactRoutes from '@/routes/contactRoutes';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Configurações de segurança
app.use(helmet({
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

// Configuração CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.API_RATE_LIMIT || '100'), // limite de requests por IP
    message: {
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit excedido', {
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

// Compressão
app.use(compression());

// Logging de requisições HTTP
app.use(morgan('combined', { stream }));

// Middleware para log de tentativas de autenticação
app.use((req: any, _res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log apenas tentativas de autenticação
    if (req.path.includes('/auth') || req.path.includes('/login')) {
        logger.info('Tentativa de autenticação', {
            ip,
            userAgent,
            path: req.path,
            method: req.method
        });
    }

    next();
});

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitização de dados
app.use(mongoSanitize());
// Middleware XSS: sanitiza strings em body, query e params
app.use((req, _res, next) => {
    const sanitize = (obj: any): any => {
        if (typeof obj === 'string') return xss(obj);
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (obj && typeof obj === 'object') {
            const out: any = {};
            for (const [k, v] of Object.entries(obj)) out[k] = sanitize(v);
            return out;
        }
        return obj;
    };
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
});

// Middleware para injeção do banco de dados
app.use(injectDatabase);

// Middleware de tratamento de erros de JSON
app.use(jsonErrorHandler);

// Rota de health check
app.get('/health', (_req: any, res: any) => {
    res.json({
        success: true,
        message: 'API funcionando corretamente',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota de informações da API
app.get('/api/info', (_req: any, res: any) => {
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

// Rotas da API com autenticação
app.use('/api/contacts', authenticateToken, contactRoutes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Função para inicializar a aplicação
const startServer = async (): Promise<void> => {
    try {
        // Testar conexão com banco de dados
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('Falha ao conectar com o banco de dados');
        }

        const port = process.env.PORT || 3001;
        const server = app.listen(port, () => {
            logger.info(`Servidor iniciado na porta ${port}`);
            logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Health check: http://localhost:${port}/health`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal: string): Promise<void> => {
            logger.info(`Recebido sinal ${signal}. Iniciando shutdown graceful...`);

            server.close(async () => {
                logger.info('Servidor HTTP fechado');

                try {
                    await closePool();
                    logger.info('Conexões com banco de dados fechadas');
                    process.exit(0);
                } catch (error) {
                    logger.error('Erro durante shutdown:', error);
                    process.exit(1);
                }
            });

            // Forçar shutdown após 30 segundos
            setTimeout(() => {
                logger.error('Forçando shutdown após timeout');
                process.exit(1);
            }, 30000);
        };

        // Capturar sinais de shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Capturar erros não tratados
        process.on('uncaughtException', (error: any) => {
            logger.error('Erro não capturado:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason: any, promise: any) => {
            logger.error('Promise rejeitada não tratada:', { reason, promise });
            process.exit(1);
        });

    } catch (error) {
        logger.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// Iniciar servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
    startServer();
}

export default app;
