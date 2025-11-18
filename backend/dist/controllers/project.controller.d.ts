import { Request, Response } from 'express';
export declare const createProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listProjects: (req: Request, res: Response) => Promise<void>;
export declare const getProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=project.controller.d.ts.map