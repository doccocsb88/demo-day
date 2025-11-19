import { sql } from '@vercel/postgres';
import { FirebaseProject } from '../types';

export class ProjectModel {
  async create(project: FirebaseProject): Promise<FirebaseProject> {
    await sql`
      INSERT INTO projects (
        id, name, project_id, private_key, client_email,
        api_key, auth_domain, storage_bucket, messaging_sender_id,
        app_id, measurement_id, general_config, slack_webhook_url,
        created_by, created_at, updated_at
      ) VALUES (
        ${project.id},
        ${project.name},
        ${project.projectId},
        ${project.privateKey},
        ${project.clientEmail},
        ${project.apiKey},
        ${project.authDomain},
        ${project.storageBucket},
        ${project.messagingSenderId},
        ${project.appId},
        ${project.measurementId || null},
        ${project.generalConfig || null},
        ${project.slackWebhookUrl || null},
        ${project.createdBy},
        ${project.createdAt},
        ${project.updatedAt}
      )
    `;
    return project;
  }

  async findById(id: string): Promise<FirebaseProject | null> {
    const result = await sql`
      SELECT * FROM projects WHERE id = ${id}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToProject(result.rows[0]);
  }

  async findByProjectId(projectId: string): Promise<FirebaseProject | null> {
    const result = await sql`
      SELECT * FROM projects WHERE project_id = ${projectId}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToProject(result.rows[0]);
  }

  async findAll(): Promise<FirebaseProject[]> {
    const result = await sql`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `;
    
    return result.rows.map(row => this.mapRowToProject(row));
  }

  async update(id: string, updates: Partial<FirebaseProject>): Promise<void> {
    // Build update query dynamically
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setParts.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.projectId !== undefined) {
      setParts.push(`project_id = $${paramIndex++}`);
      values.push(updates.projectId);
    }
    if (updates.privateKey !== undefined) {
      setParts.push(`private_key = $${paramIndex++}`);
      values.push(updates.privateKey);
    }
    if (updates.clientEmail !== undefined) {
      setParts.push(`client_email = $${paramIndex++}`);
      values.push(updates.clientEmail);
    }
    if (updates.apiKey !== undefined) {
      setParts.push(`api_key = $${paramIndex++}`);
      values.push(updates.apiKey);
    }
    if (updates.authDomain !== undefined) {
      setParts.push(`auth_domain = $${paramIndex++}`);
      values.push(updates.authDomain);
    }
    if (updates.storageBucket !== undefined) {
      setParts.push(`storage_bucket = $${paramIndex++}`);
      values.push(updates.storageBucket);
    }
    if (updates.messagingSenderId !== undefined) {
      setParts.push(`messaging_sender_id = $${paramIndex++}`);
      values.push(updates.messagingSenderId);
    }
    if (updates.appId !== undefined) {
      setParts.push(`app_id = $${paramIndex++}`);
      values.push(updates.appId);
    }
    if (updates.measurementId !== undefined) {
      setParts.push(`measurement_id = $${paramIndex++}`);
      values.push(updates.measurementId === null ? null : updates.measurementId);
    }
    if (updates.generalConfig !== undefined) {
      setParts.push(`general_config = $${paramIndex++}`);
      values.push(updates.generalConfig === null ? null : updates.generalConfig);
    }
    if (updates.slackWebhookUrl !== undefined) {
      setParts.push(`slack_webhook_url = $${paramIndex++}`);
      values.push(updates.slackWebhookUrl === null ? null : updates.slackWebhookUrl);
    }

    // Always update updated_at
    setParts.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add id to values for WHERE clause
    values.push(id);

    const query = `UPDATE projects SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
    
    await sql.query(query, values);
  }

  async delete(id: string): Promise<void> {
    await sql`
      DELETE FROM projects WHERE id = ${id}
    `;
  }

  private mapRowToProject(row: any): FirebaseProject {
    return {
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      privateKey: row.private_key,
      clientEmail: row.client_email,
      apiKey: row.api_key,
      authDomain: row.auth_domain,
      storageBucket: row.storage_bucket,
      messagingSenderId: row.messaging_sender_id,
      appId: row.app_id,
      measurementId: row.measurement_id || undefined,
      generalConfig: row.general_config || undefined,
      slackWebhookUrl: row.slack_webhook_url || undefined,
      createdBy: row.created_by,
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
    };
  }
}
