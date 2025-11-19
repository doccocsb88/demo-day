# Quick Setup: MONGODB_URI trên Vercel

## 🚀 5 Bước nhanh

### 1. Tạo MongoDB Atlas Cluster
- Truy cập: https://www.mongodb.com/cloud/atlas
- Click **"Build a Database"** → Chọn **FREE** tier
- Chọn AWS + Region gần nhất → **Create**

### 2. Tạo Database User
- Trong setup wizard hoặc **Database Access**
- Username: `demoday-user` (hoặc tên khác)
- Password: Tạo password mạnh (lưu lại!)
- Click **Create**

### 3. Cấu hình Network Access
- Vào **Network Access**
- Click **"Allow Access from Anywhere"**
- IP: `0.0.0.0/0` → **Confirm**

### 4. Lấy Connection String
- Vào **Database** → Click **Connect** trên cluster
- Chọn **"Connect your application"**
- Driver: `Node.js` → Copy connection string
- Thay `<username>` và `<password>` bằng thông tin đã tạo
- **Thêm tên database** vào cuối URL:
  ```
  mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/demoday?retryWrites=true&w=majority
  ```

### 5. Thêm vào Vercel
- Vercel Dashboard → Project → **Settings** → **Environment Variables**
- **Name**: `MONGODB_URI`
- **Value**: Paste connection string đã sửa
- **Environment**: ✅ Production, ✅ Preview
- Click **Save** → **Redeploy**

## ✅ Kiểm tra

1. Redeploy project trên Vercel
2. Xem logs trong Deployments → Functions
3. Test API: `GET https://demo-day-backend-nine.vercel.app/api/projects`

## 🔧 Troubleshooting

| Lỗi | Giải pháp |
|------|-----------|
| "MONGODB_URI not set" | Kiểm tra Environment Variables → Redeploy |
| "Authentication failed" | Kiểm tra username/password trong connection string |
| "Connection timeout" | Kiểm tra Network Access đã cho phép `0.0.0.0/0` |
| "Invalid connection string" | Đảm bảo đã thay `<username>`, `<password>`, và thêm database name |

---

📖 **Chi tiết đầy đủ**: Xem file `MONGODB_VERCEL_SETUP.md`

