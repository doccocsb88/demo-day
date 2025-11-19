# Frontend Vercel Deployment

Frontend được deploy riêng trên Vercel và gọi API đến backend riêng.

## Backend API

Backend được deploy tại: **https://demo-day-backend-nine.vercel.app/api**

Frontend tự động sử dụng URL này để gọi API.

## Cấu hình (Optional)

Nếu bạn muốn thay đổi backend URL, thêm environment variable trong Vercel Dashboard:

```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Cấu trúc

- Frontend: Deploy trên Vercel, serve static files từ `dist/`
- Backend: Deploy riêng trên Vercel tại domain khác
- API calls: Frontend gọi trực tiếp đến backend domain

## Build & Deploy

1. Frontend build: `npm run build` → output vào `dist/`
2. Vercel tự động detect và deploy
3. Tất cả routes được rewrite về `/index.html` cho SPA routing

## Lưu ý

- Backend cần cấu hình CORS để cho phép frontend domain
- Backend đã có `cors()` middleware, cho phép tất cả origins (có thể cấu hình lại để bảo mật hơn)

