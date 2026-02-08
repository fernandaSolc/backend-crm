import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '@/config/logger';
import { RequestWithUser, JwtPayload, UnauthorizedError, ForbiddenError } from '@/types';

// Middleware de autenticação JWT
export const authenticateToken = (
    req: RequestWithUser,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            throw new UnauthorizedError('Token de acesso não fornecido');
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.error('JWT_SECRET não configurado');
            throw new UnauthorizedError('Configuração de autenticação inválida');
        }

        jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
            if (err) {
                logger.warn('Token JWT inválido', { error: err.message });
                throw new UnauthorizedError('Token inválido ou expirado');
            }

            const payload = decoded as JwtPayload;

            // Verificar se o payload contém os campos necessários
            if (!payload.userId || !payload.companyId || !payload.email) {
                throw new UnauthorizedError('Token malformado');
            }

            req.user = payload;
            next();
        });
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar se o usuário pertence à empresa
export const checkCompanyAccess = (
    req: RequestWithUser,
    _res: Response,
    next: NextFunction
): void => {
    try {
        if (!req.user) {
            throw new UnauthorizedError('Usuário não autenticado');
        }

        const { companyId } = req.user;

        // Verificar se o company_id na URL corresponde ao do usuário
        const urlCompanyId = req.params.companyId || req.body.company_id;

        if (urlCompanyId && parseInt(urlCompanyId) !== companyId) {
            throw new ForbiddenError('Acesso negado: empresa não autorizada');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar roles/permissões
export const requireRole = (allowedRoles: string[]) => {
    return (req: RequestWithUser, _res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Usuário não autenticado');
            }

            const { role } = req.user;

            if (!allowedRoles.includes(role)) {
                throw new ForbiddenError('Permissão insuficiente');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = requireRole(['admin', 'super_admin']);

// Middleware para verificar se o usuário pode gerenciar contatos
export const requireContactAccess = requireRole(['admin', 'manager', 'user']);

// Middleware opcional de autenticação (não falha se não houver token)
export const optionalAuth = (
    req: RequestWithUser,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            next();
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            next();
            return;
        }

        jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
            if (err) {
                next();
                return;
            }

            const payload = decoded as JwtPayload;

            if (payload.userId && payload.companyId && payload.email) {
                req.user = payload;
            }

            next();
        });
    } catch (error) {
        next();
    }
};

// Função para gerar token JWT
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET não configurado');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
};

// Função para verificar token sem middleware
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return null;
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
};

// Middleware para log de tentativas de autenticação
export const logAuthAttempts = (
    req: any,
    _res: Response,
    next: NextFunction
): void => {
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
};
