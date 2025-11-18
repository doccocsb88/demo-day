import { FirebaseProject } from '../types';
export declare class ProjectModel {
    private db;
    private collection;
    connect(): Promise<void>;
    create(project: FirebaseProject): Promise<FirebaseProject>;
    findById(id: string): Promise<FirebaseProject | null>;
    findByProjectId(projectId: string): Promise<FirebaseProject | null>;
    findAll(): Promise<FirebaseProject[]>;
    update(id: string, updates: Partial<FirebaseProject>): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=project.model.d.ts.map