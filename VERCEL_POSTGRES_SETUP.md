# Hướng dẫn sử dụng Vercel Postgres

Vercel Postgres là database được Vercel cung cấp sẵn, tích hợp hoàn toàn với Vercel platform. Không cần cấu hình MongoDB Atlas nữa!

## Bước 1: Tạo Vercel Postgres Database

### 1.1. Vào Vercel Dashboard

1. Truy cập: https://vercel.com/dashboard
2. Chọn project backend của bạn (project chứa API routes)

### 1.2. Tạo Postgres Database

1. Vào tab **"Storage"** (hoặc **"Databases"**)
2. Click **"Create Database"**
3. Chọn **"Postgres"**
4. Chọn plan:
   - **Hobby** (FREE) - Đủ cho development và small projects
   - **Pro** - Cho production với nhiều features hơn
5. Chọn region gần nhất (ví dụ: `us-east-1`)
6. Đặt tên database (ví dụ: `demoday-db`)
7. Click **"Create"**

### 1.3. Lấy Connection String

Sau khi tạo database, Vercel tự động:
- Tạo connection string
- Thêm vào Environment Variables với tên `POSTGRES_URL`
- Tạo các biến môi trường khác:
  - `POSTGRES_PRISMA_URL` (cho Prisma)
  - `POSTGRES_URL_NON_POOLING` (cho migrations)
  - `POSTGRES_USER`
  - `POSTGRES_HOST`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DATABASE`

**Không cần làm gì thêm!** Vercel đã tự động cấu hình sẵn.

## Bước 2: Cài đặt Dependencies

Backend cần cài đặt package để kết nối Postgres:

```bash
cd backend
npm install @vercel/postgres
```

Hoặc nếu muốn dùng Prisma (ORM mạnh hơn):

```bash
npm install @prisma/client @vercel/postgres
npm install -D prisma
```

## Bước 3: Chạy Migration

Sau khi deploy, bạn cần chạy migration để tạo các bảng trong database:

### Cách 1: Chạy migration script (Local)

```bash
cd backend
npm run migrate
```

### Cách 2: Chạy migration trên Vercel (Recommended)

1. Vào Vercel Dashboard > Project > **Deployments**
2. Click vào deployment mới nhất
3. Vào tab **Functions** hoặc **Logs**
4. Hoặc sử dụng Vercel CLI:

```bash
vercel env pull .env.local
npm run migrate
```

### Cách 3: Chạy SQL trực tiếp trong Vercel Dashboard

1. Vào **Storage** > Chọn Postgres database
2. Click **"Query"** tab
3. Copy nội dung từ `backend/src/db/schema.sql`
4. Paste và chạy

## Bước 4: Redeploy

1. Commit và push code mới
2. Vercel sẽ tự động deploy
3. Chạy migration (nếu chưa chạy)
4. Database đã sẵn sàng sử dụng!

## Ưu điểm của Vercel Postgres

✅ **Tích hợp sẵn**: Không cần cấu hình connection string thủ công  
✅ **Tự động scale**: Vercel tự động quản lý  
✅ **Free tier**: Hobby plan miễn phí cho development  
✅ **Fast**: Kết nối nhanh vì cùng network với Vercel  
✅ **Backup tự động**: Vercel tự động backup  
✅ **Monitoring**: Có sẵn metrics và monitoring  

## So sánh với MongoDB

| Feature | MongoDB Atlas | Vercel Postgres |
|---------|---------------|-----------------|
| Setup | Phức tạp (tạo cluster, user, network) | Đơn giản (1 click) |
| Connection String | Phải cấu hình thủ công | Tự động |
| Cost | Free tier có giới hạn | Free tier rộng rãi hơn |
| Integration | Phải cấu hình riêng | Tích hợp sẵn |
| Performance | Tốt | Rất tốt (cùng network) |

## Lưu ý

- Vercel Postgres dựa trên **Neon** (serverless Postgres)
- Hỗ trợ đầy đủ SQL và transactions
- Có thể dùng với Prisma, Drizzle, hoặc raw SQL
- Connection pooling tự động được quản lý

## Troubleshooting

### Lỗi: "POSTGRES_URL is not defined"

**Giải pháp**: 
- Kiểm tra đã tạo Postgres database chưa
- Kiểm tra Environment Variables trong Vercel
- Redeploy sau khi tạo database

### Lỗi: "relation does not exist"

**Giải pháp**:
- Chạy migration script để tạo tables
- Kiểm tra schema đã được tạo đúng chưa

---

📖 **Tiếp theo**: Xem code migration và models đã được cập nhật để sử dụng Postgres.

