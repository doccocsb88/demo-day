import { RemoteConfigSnapshot, RemoteConfigChangeRequest } from '../types';
export declare class DiffService {
    generateDiff(baseConfig: RemoteConfigSnapshot, newConfig: RemoteConfigSnapshot): RemoteConfigChangeRequest['diff'];
    private areParamsEqual;
    private areConditionsEqual;
}
//# sourceMappingURL=diff.service.d.ts.map