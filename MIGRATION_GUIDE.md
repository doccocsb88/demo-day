# Migration Guide: MongoDB → Vercel Postgres

Hướng dẫn chuyển đổi từ MongoDB sang Vercel Postgres.

## ✅ Đã hoàn thành

1. ✅ Cập nhật `backend/package.json`:
   - Xóa `mongodb`
   - Thêm `@vercel/postgres`

2. ✅ Tạo database schema: `backend/src/db/schema.sql`
   - Table `projects`
   - Table `change_requests`
   - Table `audit_logs`
   - Tất cả indexes cần thiết

3. ✅ Tạo migration script: `backend/src/db/migrate.ts`

4. ✅ Cập nhật `ProjectModel` để dùng Postgres

## 🔄 Cần làm tiếp

### 1. Cập nhật các Models còn lại

Cần cập nhật:
- `backend/src/models/change-request.model.ts` → Dùng Postgres
- `backend/src/models/audit-log.model.ts` → Dùng Postgres

### 2. Tạo Vercel Postgres Database

1. Vào Vercel Dashboard > Project backend
2. Tab **Storage** > **Create Database**
3. Chọn **Postgres** > **Hobby** (FREE)
4. Vercel tự động tạo environment variables

### 3. Chạy Migration

Sau khi tạo database, chạy migration:

```bash
cd backend
npm install  # Cài @vercel/postgres
npm run migrate
```

Hoặc chạy SQL trực tiếp trong Vercel Dashboard > Storage > Query tab.

### 4. Test

1. Deploy backend lên Vercel
2. Test API endpoints:
   - `GET /api/projects` - Should return `[]` (empty array)
   - `POST /api/projects` - Create a project
   - `GET /api/projects/:id` - Get project

## 📝 Thay đổi chính

### Before (MongoDB)
```typescript
import { MongoClient, Db, Collection } from 'mongodb';

const client = new MongoClient(uri);
await client.connect();
const collection = db.collection('projects');
await collection.insertOne(project);
```

### After (Vercel Postgres)
```typescript
import { sql } from '@vercel/postgres';

await sql`INSERT INTO projects (...) VALUES (...)`;
const result = await sql`SELECT * FROM projects WHERE id = ${id}`;
```

## 🎯 Lợi ích

- ✅ Không cần cấu hình MongoDB Atlas
- ✅ Tự động có connection string
- ✅ Tích hợp sẵn với Vercel
- ✅ Free tier rộng rãi
- ✅ Performance tốt (cùng network)

## ⚠️ Lưu ý

- **Data migration**: Nếu có data trong MongoDB, cần migrate data sang Postgres
- **Environment variables**: Vercel tự động tạo `POSTGRES_URL`, không cần `MONGODB_URI` nữa
- **Schema changes**: Nếu cần thay đổi schema, update `schema.sql` và chạy lại migration

## 🔧 Troubleshooting

### Lỗi: "relation does not exist"
→ Chưa chạy migration. Chạy `npm run migrate` hoặc SQL trong Vercel Dashboard.

### Lỗi: "POSTGRES_URL is not defined"
→ Chưa tạo Postgres database trong Vercel. Tạo database trong Storage tab.

### Lỗi: "Cannot find module '@vercel/postgres'"
→ Chưa cài package. Chạy `npm install` trong backend folder.

