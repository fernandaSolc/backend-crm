import winston from 'winston';
import { LogLevel } from '@/types';
import { Request, Response } from 'express';
interface MorganStream {
    write: (message: string) => void;
}
declare const logger: winston.Logger;
declare const stream: MorganStream;
export declare const logRequest: (req: Request, res: Response, responseTime: number) => void;
export declare const logError: (error: Error, req?: Request) => void;
export declare const logDatabase: (operation: string, table: string, duration: number, error?: Error) => void;
export declare const logSecurity: (event: string, details: Record<string, any>) => void;
export declare const logCustom: (level: keyof LogLevel, message: string, meta?: Record<string, any>) => void;
export { stream };
export default logger;
//# sourceMappingURL=logger.d.ts.map