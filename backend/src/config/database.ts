import { Pool, PoolClient, QueryResult } from 'pg';
import logger from './logger';
import { DatabaseConfig, DatabaseInterface } from '@/types';

// Configuração do pool de conexões PostgreSQL
const poolConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'crm_juridico',
    user: process.env.DB_USER || 'crm_app_user',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false,
        // ca: process.env.DB_SSL_CA_PATH ? require('fs').readFileSync(process.env.DB_SSL_CA_PATH) : undefined
    } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '30') * 1000,
    idleTimeoutMillis: 30000,
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '300') * 1000,
    statement_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '300') * 1000,
    application_name: 'contatos-crm-api'
};

// Criar pool de conexões
const pool = new Pool(poolConfig);

// Event listeners para monitoramento
pool.on('connect', (_client: PoolClient) => {
    logger.info('Nova conexão estabelecida com o banco de dados');
});

pool.on('error', (err: Error) => {
    logger.error('Erro inesperado no pool de conexões:', err);
});

pool.on('remove', (_client: PoolClient) => {
    logger.info('Conexão removida do pool');
});

// Função para testar conexão
export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        client.release();

        logger.info('Conexão com banco de dados estabelecida com sucesso');
        logger.info(`PostgreSQL Version: ${result.rows[0].version}`);
        logger.info(`Current Time: ${result.rows[0].current_time}`);

        return true;
    } catch (error) {
        logger.error('Erro ao conectar com o banco de dados:', error);
        return false;
    }
};

// Função para executar query com retry
export const queryWithRetry = async (
    text: string,
    params: any[] = [],
    retries: number = 3
): Promise<QueryResult> => {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await pool.query(text, params);
            return result;
        } catch (error) {
            logger.error(`Tentativa ${i + 1} falhou:`, (error as Error).message);

            if (i === retries - 1) {
                throw error;
            }

            // Aguardar antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }

    throw new Error('Todas as tentativas falharam');
};

// Função para transação
export const transaction = async <T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Função para fechar pool (usado no shutdown)
export const closePool = async (): Promise<void> => {
    try {
        await pool.end();
        logger.info('Pool de conexões fechado com sucesso');
    } catch (error) {
        logger.error('Erro ao fechar pool de conexões:', error);
    }
};

// Interface do banco de dados
const databaseInterface: DatabaseInterface = {
    query: queryWithRetry,
    transaction,
    pool
};

// Middleware para injeção de dependência
export const injectDatabase = (req: any, _res: any, next: any): void => {
    req.db = databaseInterface;
    next();
};

export default {
    pool,
    queryWithRetry,
    transaction,
    testConnection,
    closePool,
    injectDatabase
};
