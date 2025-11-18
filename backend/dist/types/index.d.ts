export type RemoteConfigParameter = {
    key: string;
    defaultValue?: string;
    conditionalValues?: {
        [conditionName: string]: string;
    };
    description?: string;
};
export type RemoteConfigCondition = {
    name: string;
    expression: string;
    tag?: string;
};
export type RemoteConfigSnapshot = {
    id: string;
    parameters: RemoteConfigParameter[];
    conditions: RemoteConfigCondition[];
    createdAt: string;
    createdBy: string;
};
export type ChangeStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
export type ReviewerStatus = 'pending' | 'approved' | 'denied';
export type Reviewer = {
    userId: string;
    status: ReviewerStatus;
    message?: string;
    reviewedAt?: string;
};
export type RemoteConfigChangeRequest = {
    id: string;
    title: string;
    description?: string;
    baseVersionId: string;
    projectId?: string;
    env: 'prod' | 'staging';
    newConfig: RemoteConfigSnapshot;
    diff: {
        addedParams: string[];
        removedParams: string[];
        updatedParams: {
            key: string;
            from: RemoteConfigParameter | null;
            to: RemoteConfigParameter | null;
        }[];
        addedConditions: string[];
        removedConditions: string[];
        updatedConditions: {
            name: string;
            from: RemoteConfigCondition | null;
            to: RemoteConfigCondition | null;
        }[];
    };
    aiSummary?: string;
    status: ChangeStatus;
    createdBy: string;
    createdAt: string;
    reviewers: Reviewer[];
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectedReason?: string;
    publishedBy?: string;
    publishedAt?: string;
};
export type AuditLog = {
    id: string;
    changeRequestId: string;
    action: string;
    performedBy: string;
    performedAt: string;
    details?: any;
};
export type UserRole = 'viewer' | 'editor' | 'reviewer' | 'admin';
export type User = {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
};
export type FirebaseProject = {
    id: string;
    name: string;
    projectId: string;
    privateKey: string;
    clientEmail: string;
    apiKey: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    generalConfig?: string;
    slackWebhookUrl?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
};
//# sourceMappingURL=index.d.ts.map