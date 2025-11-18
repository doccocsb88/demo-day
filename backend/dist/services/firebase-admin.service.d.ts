import * as admin from 'firebase-admin';
import { RemoteConfigSnapshot } from '../types';
export declare class FirebaseAdminService {
    private remoteConfig;
    private initialized;
    constructor();
    private initialize;
    private getRemoteConfig;
    getRemoteConfigTemplate(env?: 'prod' | 'staging'): Promise<admin.remoteConfig.RemoteConfigTemplate>;
    getSnapshot(env: "prod" | "staging" | undefined, createdBy: string): Promise<RemoteConfigSnapshot>;
    publishTemplate(newConfig: RemoteConfigSnapshot): Promise<void>;
}
//# sourceMappingURL=firebase-admin.service.d.ts.map