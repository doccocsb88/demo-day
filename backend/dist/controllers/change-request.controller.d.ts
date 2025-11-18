import { Request, Response } from 'express';
export declare class ChangeRequestController {
    private changeRequestModel;
    private auditLogModel;
    private projectModel;
    private firebaseAdmin;
    private diffService;
    private aiSummaryService;
    private slackService;
    getSnapshot(req: Request, res: Response): Promise<void>;
    createChangeRequest(req: Request, res: Response): Promise<void>;
    submitForReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addReviewer(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    reviewerApprove(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    reviewerDeny(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    approve(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    reject(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    publish(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getChangeRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    listChangeRequests(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=change-request.controller.d.ts.map