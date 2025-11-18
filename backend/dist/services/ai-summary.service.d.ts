import { RemoteConfigChangeRequest } from '../types';
export declare class AISummaryService {
    private openai;
    constructor();
    generateSummary(changeRequest: RemoteConfigChangeRequest): Promise<string>;
    private buildPrompt;
    private generateFallbackSummary;
}
//# sourceMappingURL=ai-summary.service.d.ts.map