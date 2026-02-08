import { Pool, PoolClient, QueryResult } from 'pg';
export declare const testConnection: () => Promise<boolean>;
export declare const queryWithRetry: (text: string, params?: any[], retries?: number) => Promise<QueryResult>;
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
export declare const closePool: () => Promise<void>;
export declare const injectDatabase: (req: any, _res: any, next: any) => void;
declare const _default: {
    pool: Pool;
    queryWithRetry: (text: string, params?: any[], retries?: number) => Promise<QueryResult>;
    transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
    testConnection: () => Promise<boolean>;
    closePool: () => Promise<void>;
    injectDatabase: (req: any, _res: any, next: any) => void;
};
export default _default;
//# sourceMappingURL=database.d.ts.map