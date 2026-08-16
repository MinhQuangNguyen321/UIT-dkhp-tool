# UIT Đăng Ký Học Phần Tool

Một công cụ hỗ trợ sinh viên UIT trong quá trình đăng ký học phần, tập trung vào việc:

- chọn file Excel thời khóa biểu / dữ liệu lớp học
- xem và lọc danh sách lớp
- xếp lớp từ dữ liệu import
- kiểm tra thời khóa biểu
- sinh script đăng ký học phần theo danh sách đã chọn

Dự án này là phiên bản front-end React/TypeScript của tool hỗ trợ ĐKHP, hiện đang chạy trên web và lưu trạng thái người dùng ở trình duyệt để trải nghiệm mượt hơn.

## Live demo

- Production: https://dkhp-uit.vercel.app/
- Repo gốc liên quan: https://github.com/loia5tqd001/Dang-Ky-Hoc-Phan-UIT

## Tính năng chính

### 1. Chọn file Excel

- Import file dữ liệu từ UIT hoặc file thời khóa biểu phù hợp
- Hiển thị thông tin hướng dẫn, FAQ, video và link hỗ trợ ngay trong giao diện
- Xử lý dữ liệu đầu vào bằng `xlsx`

### 2. Xếp lớp

- Giao diện bảng dữ liệu bằng AG Grid
- Lọc, sắp xếp và chọn lớp học theo nhu cầu
- Hỗ trợ lưu trạng thái đã chọn trong localStorage/sessionStorage
- Có thể duy trì trạng thái giữa các tab trình duyệt

### 3. Kết quả / TKB & script

- Hiển thị thời khóa biểu tổng hợp sau khi đã chọn lớp
- Hỗ trợ lựa chọn “Tự chuẩn bị danh sách mã lớp” khi không dùng chức năng xếp lớp
- Hiển thị tổng số tín chỉ đã chọn
- Tạo script đăng ký học phần để copy / chạy nhanh

### 4. Giao diện và trải nghiệm

- UI hiện đại với Material UI
- Drawer điều hướng 3 bước rõ ràng
- Keyboard shortcut để chuyển bước nhanh
- Hỗ trợ analytics, feedback, GitHub star CTA

## Luồng sử dụng

1. Vào bước 1: upload file Excel dữ liệu lớp học.
2. Vào bước 2: chọn các lớp phù hợp trong bảng xếp lớp.
3. Vào bước 3: kiểm tra TKB, chỉnh sửa danh sách lớp nếu cần và copy script đăng ký.

## Công nghệ sử dụng

- React 17
- TypeScript
- Material UI
- AG Grid
- Zustand
- React Router
- xlsx
- Firebase, Vercel Analytics, Speed Insights
- React Hotkeys Hook

## Cài đặt và chạy local

### Yêu cầu

- Node.js >= 16
- npm hoặc yarn

### Cài đặt

```bash
npm install
```

### Chạy dev server

```bash
npm start
```

### Build production

```bash
npm run build
```

### Chạy test

```bash
npm test
```

## Scripts có sẵn

```bash
npm start
npm run build
npm test
npm run format
npm run lint:fix
```

## Cấu trúc thư mục chính

```bash
src/
  constants.ts
  index.tsx
  tracker.ts
  tracking.utils.ts
  types.ts
  utils.ts
  views/
    1ChonFileExcel/
    2XepLop/
    3KetQua/
    components/
  zus/
```

## Bản quyền & ghi nhận

Dự án này là phiên bản/tiếp nối dựa trên ý tưởng và công việc gốc của tác giả/owner: [loia5tqd001](https://github.com/loia5tqd001) trong repo [Dang-Ky-Hoc-Phan-UIT](https://github.com/loia5tqd001/Dang-Ky-Hoc-Phan-UIT).

Tất cả quyền sở hữu và đóng góp gốc thuộc về chủ sở hữu repo này. Repo hiện tại được phát triển/tuỳ biến cho mục đích cá nhân hoặc học tập, và cần ghi nhận rõ nguồn gốc trước khi sử dụng lại, fork, hoặc phát triển tiếp.

## Lưu ý

- Đây là công cụ hỗ trợ người dùng trong quá trình đăng ký học phần, không phải sản phẩm chính thức do trường UIT phát hành.
- Dữ liệu và logic định tuyến được lưu trong browser để tăng tốc độ sử dụng và giữ trạng thái giữa các lần tương tác.

## Đóng góp

Mọi ý kiến cải tiến, bug report và pull request đều được chào đón.

## License

Dự án hiện chưa ghi rõ license cụ thể trong repo. Nếu muốn dùng cho mục đích thương mại hoặc phát triển mở rộng, nên kiểm tra kỹ với chủ sở hữu repo trước khi triển khai công khai.
