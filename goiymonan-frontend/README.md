# Gợi Ý Món Ăn – Frontend (Next.js)

Ứng dụng web cho phép người dùng nhập nguyên liệu đang có, tương tác với agent RL (backend) và gửi phản hồi like/dislike.

## 1. Yêu cầu

- Node.js 18 trở lên (khuyến nghị sử dụng cùng phiên bản với backend)
- npm hoặc pnpm/yarn (hướng dẫn dưới dùng npm)
- Backend đã chạy sẵn tại `http://localhost:3000` (xem README backend để khởi động bằng Docker)

## 2. Thiết lập môi trường

1. Cài dependencies:

   ```bash
   npm install
   ```

2. (Tuỳ chọn) Nếu backend chạy ở URL khác, tạo file `.env.local` và cấu hình:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://<backend-host>:<port>
   ```

   Mặc định ứng dụng trỏ tới `http://localhost:3000`.

## 3. Chạy ứng dụng

- **Dev mode** (Turbopack, cổng 3001):

  ```bash
  npm run dev
  ```

Mở http://localhost:3001 để sử dụng.

## 4. Luồng hoạt động chính

1. **Trang /**
   - Người dùng nhập nguyên liệu (chuỗi cách nhau bởi dấu phẩy).
   - Ứng dụng tự suy luận `meal_time` theo giờ máy (\<8h = “Ăn sáng”; 8–15h = “Ăn trưa”; còn lại “Ăn tối”).
   - Gửi `POST /env/reset` tới backend, nhận `state_id`, `stateContext`.
   - Gửi `POST /recommendations` để lấy recipe đầu tiên.
   - Lưu `ingredients`, `stateId`, `stateContext`, `currentRec` vào `sessionStorage` → chuyển sang `/recommend`.

2. **Trang /recommend**
   - Đọc dữ liệu từ `sessionStorage` để khởi tạo UI.
   - Effect `advanceEnvironment` gọi `POST /env/step` cho recipe hiện tại → cập nhật pantry, history, reward card, đồng bộ lại `sessionStorage`.
   - Nút “Dislike” → `POST /feedback` với `actionType: "dislike"`, sau đó gọi lại `/recommendations` lấy món tiếp theo.
   - Nút “Like” → `POST /feedback` với `actionType: "like"`, rồi chuyển sang `/recipe/{id}` hiển thị chi tiết.

3. **Trang /recipe/[id]**
   - Lấy thông tin recipe chi tiết (ingredient list, hướng dẫn) qua `GET /recipes/{id}`.

## 5. Cấu trúc thư mục nổi bật

```
goiymonan-frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # trang nhập nguyên liệu
│   │   ├── recommend/page.tsx# trang tương tác agent
│   │   └── recipe/[id]/...   # trang chi tiết recipe
│   ├── components/
│   │   ├── InputForm.tsx
│   │   ├── RecipeCard.tsx
│   │   └── SwipeDeck.tsx
│   ├── lib/api.ts            # axios instance (dùng NEXT_PUBLIC_API_BASE_URL)
│   └── types/                # kiểu dữ liệu recipe/ingredient
├── public/
└── package.json
```

## 6. Tips & Troubleshooting

- Khi backend trả lỗi CORS/401, kiểm tra `baseURL` và trạng thái backend (Swagger `/docs` nên truy cập được).
- Trong dev, các request đều hiển thị ở console backend với prefix `📥` – dựa vào đó để so sánh payload.
- Bạn có thể chỉnh số lượng gợi ý (`k`) trực tiếp trong `InputForm`/`RecommendPage` nếu muốn test nhiều phương án.

---
