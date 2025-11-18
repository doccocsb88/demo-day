import { RemoteConfigChangeRequest } from '../types';
export declare class ChangeRequestModel {
    private db;
    private collection;
    connect(): Promise<void>;
    create(changeRequest: RemoteConfigChangeRequest): Promise<RemoteConfigChangeRequest>;
    findById(id: string): Promise<RemoteConfigChangeRequest | null>;
    findAll(filters?: {
        env?: 'prod' | 'staging';
        status?: string;
        createdBy?: string;
    }): Promise<RemoteConfigChangeRequest[]>;
    update(id: string, updates: Partial<RemoteConfigChangeRequest>): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=change-request.model.d.ts.map