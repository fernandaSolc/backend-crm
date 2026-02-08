"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectDatabase = exports.closePool = exports.transaction = exports.queryWithRetry = exports.testConnection = void 0;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./logger"));
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'crm_juridico',
    user: process.env.DB_USER || 'crm_app_user',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false,
    } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '30') * 1000,
    idleTimeoutMillis: 30000,
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '300') * 1000,
    statement_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '300') * 1000,
    application_name: 'contatos-crm-api'
};
const pool = new pg_1.Pool(poolConfig);
pool.on('connect', (_client) => {
    logger_1.default.info('Nova conexão estabelecida com o banco de dados');
});
pool.on('error', (err) => {
    logger_1.default.error('Erro inesperado no pool de conexões:', err);
});
pool.on('remove', (_client) => {
    logger_1.default.info('Conexão removida do pool');
});
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        client.release();
        logger_1.default.info('Conexão com banco de dados estabelecida com sucesso');
        logger_1.default.info(`PostgreSQL Version: ${result.rows[0].version}`);
        logger_1.default.info(`Current Time: ${result.rows[0].current_time}`);
        return true;
    }
    catch (error) {
        logger_1.default.error('Erro ao conectar com o banco de dados:', error);
        return false;
    }
};
exports.testConnection = testConnection;
const queryWithRetry = async (text, params = [], retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await pool.query(text, params);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Tentativa ${i + 1} falhou:`, error.message);
            if (i === retries - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error('Todas as tentativas falharam');
};
exports.queryWithRetry = queryWithRetry;
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
const closePool = async () => {
    try {
        await pool.end();
        logger_1.default.info('Pool de conexões fechado com sucesso');
    }
    catch (error) {
        logger_1.default.error('Erro ao fechar pool de conexões:', error);
    }
};
exports.closePool = closePool;
const databaseInterface = {
    query: exports.queryWithRetry,
    transaction: exports.transaction,
    pool
};
const injectDatabase = (req, _res, next) => {
    req.db = databaseInterface;
    next();
};
exports.injectDatabase = injectDatabase;
exports.default = {
    pool,
    queryWithRetry: exports.queryWithRetry,
    transaction: exports.transaction,
    testConnection: exports.testConnection,
    closePool: exports.closePool,
    injectDatabase: exports.injectDatabase
};
//# sourceMappingURL=database.js.map