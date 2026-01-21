# CHANGELOG - Anonymous Reviews & Rating System Implementation

## **1. Tổng quan các tính năng đã cập nhật**

### **A. Hệ thống Review & Rating (Mới)**
*   **Anonymous Reviews:** Cho phép người dùng chưa đăng nhập gửi bình luận.
    *   Nhập Nickname (tùy chọn, mặc định là "Ẩn danh").
    *   Nhập nội dung bình luận.
    *   Đánh giá sao (1 - 5 sao).
*   **Hiển thị:**
    *   Hiển thị danh sách bình luận ngay bên dưới chi tiết truyện (trong Modal).
    *   Hiển thị điểm đánh giá trung bình và tổng số lượt đánh giá ngay trên header của truyện.
*   **Bảo vệ cơ bản:**
    *   Lọc từ ngữ thô tục đơn giản (trong Backend Controller).
    *   Lưu IP người gửi (để admin theo dõi sau này nếu cần chặn spam).

### **B. Admin Dashboard (Cải tiến)**
*   **Tab "Bình luận (Reviews)" mới:**
    *   Xem danh sách 20 bình luận mới nhất toàn hệ thống.
    *   Hiển thị chi tiết: Thời gian, Nickname, Tên truyện, Số sao, Nội dung.
    *   Chức năng **Xóa bình luận** vi phạm trực tiếp từ bảng điều khiển.

---

## **2. Chi tiết các file đã chỉnh sửa/tạo mới**

### **Backend (`D:\code linh tinh\new`)**
1.  **`models/Review.js` (Mới):** Schema MongoDB cho bình luận (nickname, content, rating, novelId, ipAddress).
2.  **`models/Novel.js` (Sửa):** Thêm field `ratingAverage` (Number) và `reviewCount` (Number).
3.  **`models/index.js` (Sửa):** Export model `Review`.
4.  **`controllers/reviewController.js` (Mới):**
    *   `createReview`: Tạo review mới + tính lại điểm trung bình cho truyện.
    *   `getReviewsByNovel`: Lấy danh sách review theo truyện.
    *   `getLatestReviews`: API cho Admin lấy review mới nhất.
    *   `deleteReview`: Xóa review + tính lại điểm trung bình.
5.  **`routes/reviewRoutes.js` (Mới):** Định nghĩa các endpoints `/api/reviews`.
6.  **`routes/index.js` (Sửa):** Gom nhóm `reviewRoutes`.
7.  **`server.js` (Sửa):** Đăng ký route `/api/reviews`.

### **Frontend (`D:\code linh tinh\new\client`)**
1.  **`src/components/StarRating.jsx` (Mới):** Component hiển thị 5 ngôi sao (dùng cho cả việc chấm điểm và hiển thị điểm).
2.  **`src/components/ReviewSection.jsx` (Mới):** Giao diện form nhập review + list review bên dưới.
3.  **`src/components/NovelModal.jsx` (Sửa):**
    *   Import và chèn `<ReviewSection />` vào cuối modal.
    *   Thêm logic hiển thị Rating Badge (Điểm số sao vàng) ở phần thông tin truyện.
4.  **`src/services/api.js` (Sửa):** Thêm 2 hàm `createReview` và `getReviews` để gọi API.

### **Admin Tool (`D:\code linh tinh\new\public\admin.html`)**
1.  **HTML/CSS:** Thêm Tab button "Bình luận (Reviews)" và cấu trúc bảng hiển thị review.
2.  **JavaScript (Embedded):** Thêm hàm `loadLatestReviews()` và `deleteReview()` để admin tương tác với dữ liệu.

---

## **3. Ghi chú cho Agent tiếp theo (Troubleshooting & Next Steps)**

Nếu tính năng chưa hoạt động như ý, vui lòng kiểm tra:

1.  **CSS/Styles:** Admin Panel (`admin.html`) có một số lỗi cú pháp CSS nhỏ (do quá trình replace text tự động có thể chèn nhầm vị trí dấu đóng ngoặc `}`). Cần vào format lại code CSS trong thẻ `<style>` của file này.
2.  **Server Restart:** Người dùng cần restart lại Backend Server (để nhận Model/Routes mới) thì API `/api/reviews` mới hoạt động (tránh lỗi 404).
3.  **Client Build:** Người dùng cần đảm bảo `ReviewSection` đã được build/load đúng trong React.
4.  **Data Migration:** Các truyện cũ (`Novel`) chưa có field `ratingAverage`, `reviewCount`. Chúng sẽ mặc định là undefined/0. Khi có review mới đầu tiên được tạo, code sẽ tự update lại các fields này.
