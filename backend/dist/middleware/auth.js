"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuthAttempts = exports.verifyToken = exports.generateToken = exports.optionalAuth = exports.requireContactAccess = exports.requireAdmin = exports.requireRole = exports.checkCompanyAccess = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("@/config/logger"));
const types_1 = require("@/types");
const authenticateToken = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw new types_1.UnauthorizedError('Token de acesso não fornecido');
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.default.error('JWT_SECRET não configurado');
            throw new types_1.UnauthorizedError('Configuração de autenticação inválida');
        }
        jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                logger_1.default.warn('Token JWT inválido', { error: err.message });
                throw new types_1.UnauthorizedError('Token inválido ou expirado');
            }
            const payload = decoded;
            if (!payload.userId || !payload.companyId || !payload.email) {
                throw new types_1.UnauthorizedError('Token malformado');
            }
            req.user = payload;
            next();
        });
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const checkCompanyAccess = (req, _res, next) => {
    try {
        if (!req.user) {
            throw new types_1.UnauthorizedError('Usuário não autenticado');
        }
        const { companyId } = req.user;
        const urlCompanyId = req.params.companyId || req.body.company_id;
        if (urlCompanyId && parseInt(urlCompanyId) !== companyId) {
            throw new types_1.ForbiddenError('Acesso negado: empresa não autorizada');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.checkCompanyAccess = checkCompanyAccess;
const requireRole = (allowedRoles) => {
    return (req, _res, next) => {
        try {
            if (!req.user) {
                throw new types_1.UnauthorizedError('Usuário não autenticado');
            }
            const { role } = req.user;
            if (!allowedRoles.includes(role)) {
                throw new types_1.ForbiddenError('Permissão insuficiente');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin', 'super_admin']);
exports.requireContactAccess = (0, exports.requireRole)(['admin', 'manager', 'user']);
const optionalAuth = (req, _res, next) => {
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
        jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                next();
                return;
            }
            const payload = decoded;
            if (payload.userId && payload.companyId && payload.email) {
                req.user = payload;
            }
            next();
        });
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const generateToken = (payload) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET não configurado');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return null;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
const logAuthAttempts = (req, _res, next) => {
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
};
exports.logAuthAttempts = logAuthAttempts;
//# sourceMappingURL=auth.js.map