# GoiYMonAn Backend

Express + Prisma service cung cấp môi trường Reinforcement Learning (RL) cho bài toán gợi ý món ăn. Đây là nơi sinh viên có thể "luyện" các thuật toán Q-Learning, SARSA, DQN, Multi-Armed Bandit với seed dữ liệu cố định và API rõ ràng.

## 1. Chức năng chính

- REST API cho môi trường RL (reset, step, feedback, recommendation).
- Seed sẵn 1 user mặc định, 10 món ăn quen thuộc và 15 nguyên liệu cơ bản.
- Tính reward dựa trên mức độ khớp nguyên liệu, đánh giá recipe và phản hồi thực tế.
- Hỗ trợ kết nối tới một RL-service bên ngoài (định nghĩa trong env)
- Swagger UI tại `/docs` để cả người và ChatGPT/Gemini tham chiếu nhanh.

## 2. Yêu cầu hệ thống

- Docker Desktop ≥ 4.x (bật trước khi chạy docker-compose).
- cURL hoặc Postman để test API (khuyến khích).
- (Tuỳ chọn) Node.js 18+ nếu muốn chạy thủ công ngoài Docker.

## 3. Chuẩn bị cấu hình

1. **.env** – sao chép hoặc tạo file `.env` với nội dung mặc định:

   ```env
   PORT=3000
   DATABASE_URL=postgresql://app:pass@db:5432/recipes
   REDIS_URL=redis://redis:6379
   NODE_ENV=development
   RL_BASE=http://rl-service:8000  # thay thế bằng url server chạy thuật toán
   ```

2. **docker-compose.yml** – mô tả các service:

   ```yaml
   services:
     db: # Postgres 15 (cổng 5432)
     redis: # Redis 7   (cổng 6379)
     backend:
       build: .
       command: >
         sh -c "npx prisma migrate deploy &&
                npx prisma db seed &&
                npx nodemon --watch src --exec npm run dev"
       environment:
         - DATABASE_URL=postgresql://app:pass@db:5432/recipes
         - REDIS_URL=redis://redis:6379
   ```

3. **RL-service**:
   - Định nghĩa url tới server chứa thuật toán RL trong `.env`.

## 4. Khởi chạy Backend bằng Docker

```bash
docker-compose up --build
```

- Lần đầu build có thể mất vài phút (install packages + migrate + seed).
- Sau khi mọi thứ sẵn sàng, terminal sẽ hiện `Backend (TS) listening on 3000`.
- API chính: http://localhost:3000
- Swagger UI: http://localhost:3000/docs

> Dừng môi trường: `docker-compose down` (thêm `-v` nếu muốn xoá data Postgres/Redis).

## 5. Chạy thủ công (ngoài Docker)

> Chỉ áp dụng khi bạn tự quản lý Postgres & Redis.

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev   # hoặc npm run build && npm start
```

Nhớ cập nhật `DATABASE_URL`, `REDIS_URL` trong `.env` trỏ tới dịch vụ của bạn.

## 6. Cấu trúc thư mục

```
goiymonan-backend/
├── src/
│   ├── controllers/        # env, feedback, recommendation, recipe
│   ├── routes/             # Express routers
│   ├── utils/              # parse pantry, compute reward...
│   ├── docs/swagger.json   # OpenAPI spec (cheat sheet cho team thuật toán)
│   └── index.ts            # khởi tạo Express + swagger + middleware
├── prisma/
│   ├── schema.prisma       # định nghĩa database
│   └── seed.ts             # script seed dữ liệu
├── rl/q-learning/          # ví dụ RL-service (FastAPI + Q-learning)
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 7. API chính (tóm tắt)

| Endpoint                     | Method | Ý nghĩa                                                             |
| ---------------------------- | ------ | ------------------------------------------------------------------- |
| `/env/reset`                 | POST   | Khởi tạo state mới từ danh sách nguyên liệu (tự suy luận meal_time) |
| `/env/step`                  | POST   | Thực thi action (recipe), trả reward + state kế tiếp                |
| `/recommendations`           | POST   | Yêu cầu agent gợi ý món (qua RL-service hoặc fallback)              |
| `/feedback`                  | POST   | Lưu like/dislike thực tế, forward tới RL-service                    |
| `/recipes` / `/recipes/{id}` | GET    | Danh sách & chi tiết recipe trong seed                              |

Chi tiết payload/response nằm trong Swagger (`/docs`). Phần description trong đó được viết để copy trực tiếp cho ChatGPT/Gemini khi cần sinh code RL.

## 8. Mẹo & Troubleshooting

- **Seed lại dữ liệu**: `docker-compose run --rm backend npm run seed` (hoặc `npx prisma db seed`).
- **RL-service**: Kiểm tra lại biến môi trường, url tới server của con thuật toán xem có bị trùng port 3000 (backend đang dùng) hay 3001 (frontend đang dùng) ko?
- **Log request**: mọi request đều được log với prefix `📥 METHOD /path`; dùng để debug payload.

---

Backend environment đã sẵn sàng cho các bạn làm thuật toán. Good luck & have fun! 🚀
