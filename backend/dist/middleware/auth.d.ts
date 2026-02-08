import { Response, NextFunction } from 'express';
import { RequestWithUser, JwtPayload } from '@/types';
export declare const authenticateToken: (req: RequestWithUser, _res: Response, next: NextFunction) => void;
export declare const checkCompanyAccess: (req: RequestWithUser, _res: Response, next: NextFunction) => void;
export declare const requireRole: (allowedRoles: string[]) => (req: RequestWithUser, _res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: RequestWithUser, _res: Response, next: NextFunction) => void;
export declare const requireContactAccess: (req: RequestWithUser, _res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: RequestWithUser, _res: Response, next: NextFunction) => void;
export declare const generateToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JwtPayload | null;
export declare const logAuthAttempts: (req: any, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map