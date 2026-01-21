# 🚀 Hướng dẫn Deploy lên Render (Miễn Phí)

Web App này đã được cấu hình để deploy dễ dàng lên **Render.com** (miễn phí) theo dạng **Monorepo** (Backend phục vụ luôn Frontend).

## 1. Chuẩn bị
Đảm bảo mã nguồn của bạn đã được đẩy lên **GitHub**.
- Nếu chưa có repo: Tạo repo mới trên GitHub và push code lên.
- Đảm bảo file `.gitignore` đã chặn `node_modules` và `.env`.

## 2. Tạo Web Service trên Render
1. Truy cập [dashboard.render.com](https://dashboard.render.com/) và đăng nhập.
2. Nhấn nút **New +** và chọn **Web Service**.
3. Kết nối với tài khoản GitHub và chọn repo **timtruyenbl** của bạn.

## 3. Cấu hình
Điền các thông tin sau:

| Mục | Giá trị |
|---|---|
| **Name** | `timtruyenbl` (hoặc tên tuỳ ý) |
| **Region** | Singapore (để nhanh nhất về VN) |
| **Branch** | `main` (hoặc `master`) |
| **Root Directory** | `.` (để trống - mặc định) |
| **Runtime** | **Node** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

> **Giải thích:** 
> - `npm install`: Cài đặt dependencies cho backend.
> - `npm run build`: Script này đã được cấu hình trong `package.json` để tự động chui vào folder `client`, cài đặt dependencies cho frontend và build ra thư mục `dist`.
> - `npm start`: Chạy `node server.js` để khởi động server.

## 4. Biến môi trường (Environment Variables)
Kéo xuống phần **Environment Variables**, nhấn **Add Environment Variable** và thêm:

1. **`MONGODB_URI`**: 
   - Điền Connection String tới MongoDB Atlas của bạn.
   - Ví dụ: `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/novel_db?retryWrites=true&w=majority`
   - *Lưu ý: Bạn cần Allow Access cho `0.0.0.0/0` (Network Access) trên MongoDB Atlas để Render có thể kết nối.*

2. **`NODE_ENV`**: `production`

## 5. Hoàn tất
Nhấn **Create Web Service**. 
Render sẽ bắt đầu build và deploy. Quá trình này mất khoảng 2-5 phút.

Sau khi xong, bạn sẽ có một đường link dạng `https://timtruyenbl.onrender.com`. 
- Frontend: Truy cập link trên.
- Admin Panel: Truy cập `https://timtruyenbl.onrender.com/admin.html`.

---
## 🛠 Debug lỗi thường gặp

**Lỗi: `sh: 1: vite: not found` khi build**
-> Đảm bảo Build Command là `npm install && npm run build`. Lệnh `npm run build` sẽ gọi `cd client && npm install ...` nên sẽ cài đủ vite.

**Lỗi: Trắng trang (White screen)**
-> Kiểm tra tab Console (F12). Nếu thấy lỗi 404 file js/css, có thể do `base` trong `vite.config.js` chưa đúng. (Hiện tại config mặc định là OK).

**Lỗi: Kết nối API thất bại**
-> Kiểm tra biến `MONGODB_URI` đã đúng chưa. Xem logs trên Render Dashboard.
