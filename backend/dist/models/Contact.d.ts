import { Contact as ContactType, ContactCreateInput, ContactUpdateInput, ContactPublic, ContactValidationResult, PaginationOptionsWithFilters, DatabaseInterface } from '@/types';
export declare class Contact {
    id?: number;
    company_id: number;
    name: string;
    type: 'Pessoa' | 'Empresa';
    phone: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    notes?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    created_by?: number;
    updated_by?: number;
    constructor(data: ContactType | ContactCreateInput);
    validate(): ContactValidationResult;
    private isValidEmail;
    private isValidCPF;
    private isValidCNPJ;
    sanitize(): ContactType;
    toPublic(): ContactPublic;
    private formatPhone;
    private formatCPF;
    private formatCNPJ;
    static create(data: ContactCreateInput, db: DatabaseInterface, userId?: number): Promise<Contact>;
    static findById(id: number, db: DatabaseInterface): Promise<Contact | null>;
    static findByCompany(companyId: number, db: DatabaseInterface, options?: PaginationOptionsWithFilters): Promise<Contact[]>;
    static countByCompany(companyId: number, db: DatabaseInterface, options?: PaginationOptionsWithFilters): Promise<number>;
    update(data: ContactUpdateInput, db: DatabaseInterface, userId?: number): Promise<Contact>;
    delete(db: DatabaseInterface, userId?: number): Promise<Contact>;
}
export default Contact;
//# sourceMappingURL=Contact.d.ts.map