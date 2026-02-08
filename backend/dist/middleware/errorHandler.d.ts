import { Response, NextFunction } from 'express';
import { ApiResponse, AppError } from '@/types';
export declare const errorHandler: (error: Error, req: any, res: Response<ApiResponse>, _next: NextFunction) => void;
export declare const notFoundHandler: (req: any, res: Response<ApiResponse>, _next: NextFunction) => void;
export declare const jsonErrorHandler: (error: Error, _req: any, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const uploadErrorHandler: (error: Error, _req: any, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const rateLimitErrorHandler: (_req: any, res: Response<ApiResponse>, _next: NextFunction) => void;
export declare const createError: (message: string, statusCode?: number) => AppError;
export declare const createValidationError: (errors: any[]) => AppError;
export declare const createNotFoundError: (resource?: string) => AppError;
export declare const createUnauthorizedError: (message?: string) => AppError;
export declare const createForbiddenError: (message?: string) => AppError;
export declare const createConflictError: (message?: string) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map