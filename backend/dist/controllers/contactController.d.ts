import { Response, NextFunction } from 'express';
import { RequestWithUser, ApiResponse, PaginatedResponse, ContactPublic } from '@/types';
export declare const createContact: (req: RequestWithUser, res: Response<ApiResponse<ContactPublic>>, next: NextFunction) => Promise<void>;
export declare const getContacts: (req: RequestWithUser, res: Response<ApiResponse<PaginatedResponse<ContactPublic>>>, next: NextFunction) => Promise<void>;
export declare const getContactById: (req: RequestWithUser, res: Response<ApiResponse<ContactPublic>>, next: NextFunction) => Promise<void>;
export declare const updateContact: (req: RequestWithUser, res: Response<ApiResponse<ContactPublic>>, next: NextFunction) => Promise<void>;
export declare const deleteContact: (req: RequestWithUser, res: Response<ApiResponse<{
    id: number;
}>>, next: NextFunction) => Promise<void>;
export declare const getContactStats: (req: RequestWithUser, res: Response<ApiResponse<any>>, next: NextFunction) => Promise<void>;
export declare const restoreContact: (req: RequestWithUser, res: Response<ApiResponse<ContactPublic>>, next: NextFunction) => Promise<void>;
//# sourceMappingURL=contactController.d.ts.map