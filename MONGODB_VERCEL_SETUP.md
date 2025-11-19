# Hướng dẫn tạo và cấu hình MONGODB_URI trên Vercel

## Bước 1: Tạo MongoDB Atlas Cluster (nếu chưa có)

### 1.1. Đăng ký/Đăng nhập MongoDB Atlas

1. Truy cập: https://www.mongodb.com/cloud/atlas
2. Đăng ký tài khoản miễn phí (nếu chưa có) hoặc đăng nhập
3. Tạo một organization và project mới (hoặc sử dụng project có sẵn)

### 1.2. Tạo Cluster

1. Trong MongoDB Atlas Dashboard, click **"Build a Database"** hoặc **"Create"** > **"Database"**
2. Chọn **FREE** tier (M0) - đủ cho development
3. Chọn Cloud Provider và Region (gần Vercel servers nhất):
   - **AWS** (khuyến nghị)
   - Region: Chọn gần nhất (ví dụ: `us-east-1` nếu Vercel ở US)
4. Đặt tên cluster (ví dụ: `demo-day-cluster`)
5. Click **"Create"** và đợi cluster được tạo (2-3 phút)

## Bước 2: Tạo Database User

1. Trong quá trình setup, MongoDB sẽ yêu cầu tạo database user:
   - **Username**: Đặt tên (ví dụ: `demoday-user`)
   - **Password**: Tạo password mạnh (lưu lại để dùng sau)
   - Click **"Create Database User"**

2. Nếu đã bỏ qua, vào **"Database Access"** (menu bên trái):
   - Click **"Add New Database User"**
   - Chọn **"Password"** authentication
   - Nhập username và password
   - Database User Privileges: Chọn **"Atlas admin"** (hoặc custom role)
   - Click **"Add User"**

## Bước 3: Cấu hình Network Access

1. Vào **"Network Access"** (menu bên trái)
2. Click **"Add IP Address"**
3. Để cho phép Vercel kết nối, có 2 cách:

   **Cách 1: Cho phép tất cả IPs (Dễ nhất, nhưng kém bảo mật hơn)**
   - Click **"Allow Access from Anywhere"**
   - IP Address: `0.0.0.0/0`
   - Click **"Confirm"**

   **Cách 2: Chỉ cho phép Vercel IPs (Bảo mật hơn)**
   - Thêm các IP ranges của Vercel (xem danh sách ở dưới)
   - Hoặc sử dụng `0.0.0.0/0` cho development

4. Đợi vài phút để thay đổi có hiệu lực

## Bước 4: Lấy Connection String

1. Vào **"Database"** (menu bên trái)
2. Click **"Connect"** trên cluster của bạn
3. Chọn **"Connect your application"**
4. Chọn:
   - **Driver**: `Node.js`
   - **Version**: `5.5 or later` (hoặc version mới nhất)
5. Copy connection string, sẽ có dạng:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Thay thế:
   - `<username>`: Username bạn đã tạo ở Bước 2
   - `<password>`: Password bạn đã tạo ở Bước 2
   - URL sẽ trở thành:
   ```
   mongodb+srv://demoday-user:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

7. **Quan trọng**: Thêm tên database vào connection string:
   ```
   mongodb+srv://demoday-user:your-password@cluster0.xxxxx.mongodb.net/demoday?retryWrites=true&w=majority
   ```
   (Thay `demoday` bằng tên database bạn muốn)

## Bước 5: Thêm MONGODB_URI vào Vercel

### 5.1. Vào Vercel Dashboard

1. Truy cập: https://vercel.com/dashboard
2. Chọn project backend của bạn (project chứa API routes)

### 5.2. Thêm Environment Variable

1. Vào **"Settings"** (tab trên cùng)
2. Click **"Environment Variables"** (menu bên trái)
3. Thêm biến mới:
   - **Name**: `MONGODB_URI`
   - **Value**: Paste connection string đã copy ở Bước 4
     ```
     mongodb+srv://demoday-user:your-password@cluster0.xxxxx.mongodb.net/demoday?retryWrites=true&w=majority
     ```
   - **Environment**: Chọn:
     - ✅ **Production** (cho production)
     - ✅ **Preview** (cho preview deployments)
     - ✅ **Development** (cho development, nếu cần)
4. Click **"Save"**

### 5.3. Redeploy

1. Sau khi thêm environment variable, bạn cần **redeploy** để có hiệu lực:
   - Vào **"Deployments"** tab
   - Click **"..."** (3 chấm) trên deployment mới nhất
   - Chọn **"Redeploy"**
   - Hoặc push code mới lên Git để trigger auto-deploy

## Bước 6: Kiểm tra kết nối

1. Sau khi redeploy, kiểm tra logs:
   - Vào **"Deployments"** > Chọn deployment mới nhất
   - Click vào deployment để xem logs
   - Tìm logs từ API function (ví dụ: `/api/projects`)
   - Nếu thấy "MongoDB client connected" → thành công! ✅

2. Test API endpoint:
   - Gọi `GET https://demo-day-backend-nine.vercel.app/api/projects`
   - Nếu trả về `[]` (empty array) hoặc data → thành công! ✅
   - Nếu trả về lỗi 500, kiểm tra logs để xem lỗi cụ thể

## Troubleshooting

### Lỗi: "MONGODB_URI environment variable is not set"

**Nguyên nhân**: Environment variable chưa được thêm hoặc chưa redeploy

**Giải pháp**:
1. Kiểm tra lại trong Vercel Settings > Environment Variables
2. Đảm bảo đã chọn đúng environment (Production/Preview)
3. Redeploy project

### Lỗi: "MongoServerError: Authentication failed"

**Nguyên nhân**: Username/password sai hoặc user chưa được tạo

**Giải pháp**:
1. Kiểm tra lại username và password trong connection string
2. Đảm bảo đã escape special characters trong password (ví dụ: `@` → `%40`)
3. Kiểm tra database user trong MongoDB Atlas > Database Access

### Lỗi: "MongoServerSelectionError: connection timeout"

**Nguyên nhân**: Network Access chưa được cấu hình đúng

**Giải pháp**:
1. Vào MongoDB Atlas > Network Access
2. Đảm bảo đã thêm `0.0.0.0/0` hoặc Vercel IP ranges
3. Đợi vài phút để thay đổi có hiệu lực

### Lỗi: "MongoParseError: Invalid connection string"

**Nguyên nhân**: Connection string format sai

**Giải pháp**:
1. Kiểm tra connection string có đầy đủ không
2. Đảm bảo đã thay `<username>` và `<password>`
3. Đảm bảo có tên database trong URL (sau `.net/`)
4. Kiểm tra không có khoảng trắng thừa

## Lưu ý bảo mật

1. **Không commit connection string vào Git**: Luôn dùng environment variables
2. **Sử dụng password mạnh**: Tối thiểu 12 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
3. **Giới hạn Network Access**: Nếu có thể, chỉ cho phép Vercel IPs thay vì `0.0.0.0/0`
4. **Rotate password định kỳ**: Thay đổi password database user định kỳ
5. **Sử dụng Database User riêng**: Không dùng admin user cho application

## Vercel IP Ranges (nếu muốn giới hạn)

Vercel không công bố IP ranges cố định, nhưng bạn có thể:
- Sử dụng `0.0.0.0/0` cho development
- Hoặc sử dụng MongoDB Atlas IP Access List với các IPs cụ thể nếu biết

## Tóm tắt nhanh

1. ✅ Tạo MongoDB Atlas cluster (FREE tier)
2. ✅ Tạo database user (username + password)
3. ✅ Cấu hình Network Access (`0.0.0.0/0`)
4. ✅ Lấy connection string và thêm database name
5. ✅ Thêm `MONGODB_URI` vào Vercel Environment Variables
6. ✅ Redeploy project
7. ✅ Kiểm tra logs và test API

---

**Cần hỗ trợ?** Kiểm tra logs trong Vercel Dashboard > Deployments > Functions để xem lỗi cụ thể.

