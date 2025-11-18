import { RemoteConfigChangeRequest, Reviewer } from '../types';
export declare class SlackService {
    sendNotification(webhookUrl: string, changeRequest: RemoteConfigChangeRequest, event: 'reviewer_added' | 'submitted_for_review', reviewerId?: string): Promise<void>;
    sendReviewerNotification(webhookUrl: string, changeRequest: RemoteConfigChangeRequest, reviewer: Reviewer): Promise<void>;
}
//# sourceMappingURL=slack.service.d.ts.map