# PLAN: Bảo mật dự án TimTruyenBL (Gia cố Token)

> **Mục tiêu**: Nâng cấp bảo mật cho hệ thống hiện tại, tập trung vào Admin Panel (Single User) và bảo vệ API chung.
> **Chiến lược**: Hardening (Gia cố) thay vì thay thế hoàn toàn. Giữ cơ chế Token nhưng thêm lớp bảo vệ.

---

## 1. Phân tích Hiện trạng (Status Quo)

*   **Auth**: Token đối chiếu trực tiếp (`req.headers['x-admin-token'] === process.env.ADMIN_TOKEN`).
*   **Storage**: Token lưu ở `localStorage`.
*   **Threat Model**:
    *   Rủi ro lộ Token (Brute-force hoặc XSS).
    *   Tấn công spam API (DDoS layer 7).
    *   Tấn công Injection (MongoDB Injection).

## 2. Kế hoạch Thực hiện (Quy trình 3 bước)

### Giai đoạn 1: Bảo vệ API (Backend - `backend-specialist`)
*   [ ] **Helmet**: Cài đặt `helmet` để thiết lập HTTP Headers an toàn (Chống XSS, Clickjacking).
*   [ ] **Mongo Sanitize**: Cài đặt `express-mongo-sanitize` để chống NoSQL Injection.
*   [ ] **HPP**: Cài đặt `hpp` để chống ô nhiễm tham số HTTP (Parameter Pollution).
*   [ ] **CORS Hardening**: Siết chặt cấu hình CORS (chỉ cho phép domain Frontend, chặn tool lạ).

### Giai đoạn 2: Gia cố Admin Panel (Auth - `security-auditor`)
*   [ ] **Admin Token Logic**:
    *   Thêm cơ chế **Delay Response** khi nhập sai Token (chống Brute-force).
    *   Thêm log cảnh báo khi có IP lạ cố tình đăng nhập sai nhiều lần.
*   [ ] **IP Whitelist (Optional)**: Nếu user dùng IP tĩnh, có thể hardcode IP. (Nhưng với mạng gia đình IP động thì bỏ qua bước này để tránh tự khóa mình).

### Giai đoạn 3: Frontend Security (Admin UI - `frontend-specialist`)
*   [ ] **Logout Function**: Đảm bảo nút đăng xuất xóa sạch Token khỏi LocalStorage.
*   [ ] **Ẩn Admin**: Đổi tên file `admin.html` thành một cái tên khó đoán hơn (VD: `quan-tri-vien-xyz.html`) để tránh bot scan thấy trang đăng nhập.

---

## 3. Checklist Kiểm tra (Verification)

1.  Dùng `curl` gửi request có ký tự lạ (`$gt`, `$ne`) xem database có bị lừa không (Mongo Injection).
2.  Dùng `curl` spam request đăng nhập sai, xem server có phản hồi chậm lại không.
3.  Kiểm tra Headers trên trình duyệt xem đã có `X-Frame-Options`, `Content-Security-Policy` chưa.
