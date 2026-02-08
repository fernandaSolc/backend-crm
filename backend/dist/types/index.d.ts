export interface Contact {
    id?: number;
    company_id: number;
    name: string;
    type: 'Pessoa' | 'Empresa';
    phone: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    notes?: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
    created_by?: number;
    updated_by?: number;
}
export interface ContactCreateInput {
    company_id: number;
    name: string;
    type: 'Pessoa' | 'Empresa';
    phone: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    notes?: string;
}
export interface ContactUpdateInput {
    name?: string;
    type?: 'Pessoa' | 'Empresa';
    phone?: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    notes?: string;
    is_active?: boolean;
}
export interface ContactPublic {
    id: number;
    name: string;
    type: 'Pessoa' | 'Empresa';
    phone: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    notes?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Company {
    id?: number;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    created_at?: Date;
    updated_at?: Date;
    created_by?: number;
    updated_by?: number;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'Pessoa' | 'Empresa';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ValidationErrorClass extends Error {
    errors: ValidationError[];
    statusCode: number;
    isOperational: boolean;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean | object;
    max: number;
    min: number;
    connectionTimeoutMillis: number;
    idleTimeoutMillis: number;
    query_timeout: number;
    statement_timeout: number;
    application_name: string;
}
export interface JwtPayload {
    userId: number;
    companyId: number;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface RequestWithUser {
    user?: JwtPayload;
    db?: DatabaseInterface;
    body?: any;
    params?: any;
    query?: any;
    headers?: any;
}
export interface DatabaseInterface {
    query: (text: string, params?: any[]) => Promise<QueryResult>;
    transaction: (callback: (client: any) => Promise<any>) => Promise<any>;
    pool: any;
}
export interface QueryResult {
    rows: any[];
    rowCount: number;
    command: string;
}
export interface ContactFilters {
    company_id: number;
    search?: string;
    type?: 'Pessoa' | 'Empresa';
    is_active?: boolean;
}
export interface PaginationOptionsWithFilters extends PaginationOptions {
    is_active?: boolean;
}
export interface ContactSortOptions {
    field: 'name' | 'created_at' | 'updated_at';
    order: 'ASC' | 'DESC';
}
export interface ContactListOptions extends PaginationOptions {
    sort?: ContactSortOptions;
    filters?: ContactFilters;
}
export interface ContactValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface FormattedContact extends ContactPublic {
    formattedPhone: string;
    formattedCpf?: string;
    formattedCnpj?: string;
}
export interface ContactStats {
    total: number;
    byType: {
        Pessoa: number;
        Empresa: number;
    };
    byStatus: {
        active: number;
        inactive: number;
    };
    recent: number;
}
export interface LogLevel {
    error: 'error';
    warn: 'warn';
    info: 'info';
    debug: 'debug';
}
export interface LogEntry {
    level: keyof LogLevel;
    message: string;
    meta?: Record<string, any>;
    timestamp?: Date;
}
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
}
export interface CorsConfig {
    origin: string | string[];
    credentials: boolean;
    optionsSuccessStatus: number;
}
export interface AppConfig {
    port: number;
    nodeEnv: string;
    database: DatabaseConfig;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: CorsConfig;
    rateLimit: RateLimitConfig;
    api: {
        version: string;
        prefix: string;
    };
}
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    errors: ValidationError[];
    constructor(errors: ValidationError[], message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map