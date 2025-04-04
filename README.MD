# MultiZlogin

Hệ thống quản lý đa tài khoản Zalo, hỗ trợ đăng nhập và quản lý nhiều tài khoản Zalo cùng lúc, tích hợp proxy và webhook.

## Tính năng

- Đăng nhập nhiều tài khoản Zalo thông qua mã QR
- Hỗ trợ đăng nhập qua proxy
- Quản lý danh sách proxy
- Cấu hình webhook riêng cho từng tài khoản
- Giám sát trạng thái kết nối của các tài khoản
- API để tích hợp với các hệ thống khác
- Nhận tin nhắn và sự kiện từ Zalo thông qua webhook

## Cài đặt

### Yêu cầu hệ thống

- Node.js v16 trở lên
- npm hoặc yarn

### Các bước cài đặt

1. Clone repository:
   ```
   git clone https://github.com/yourusername/multizlogin.git
   cd multizlogin
   ```

2. Cài đặt các phụ thuộc:
   ```
   npm install
   ```

3. Tạo file `.env` từ file mẫu:
   ```
   cp .env.example .env
   ```

4. Cấu hình các biến môi trường trong file `.env`:
   ```
   PORT=3000
   SESSION_SECRET=your_secret_key
   API_KEY=your_api_key
   MESSAGE_WEBHOOK_URL=your_default_message_webhook_url
   GROUP_EVENT_WEBHOOK_URL=your_default_group_event_webhook_url
   REACTION_WEBHOOK_URL=your_default_reaction_webhook_url
   ```

5. Khởi động ứng dụng:
   ```
   npm start
   ```

### Cài đặt với Docker

1. Chuẩn bị môi trường Docker:
   ```
   ./prepare-docker.sh
   ```
   Script này sẽ tạo thư mục `zalo_data` và các file cần thiết.

2. Cấu trúc thư mục `zalo_data`:
   ```
   zalo_data/
   ├── cookies/       # Lưu trữ cookie đăng nhập Zalo
   ├── proxies.json   # Cấu hình danh sách proxy
   └── .env           # Biến môi trường cho Docker
   ```

3. Khởi động với Docker:
   ```
   docker-compose up -d
   ```

4. Cập nhật và triển khai image mới:
   ```
   ./update-zalo-server.sh
   ```

## Sử dụng

1. Mở trình duyệt và truy cập: `http://localhost:3000`
2. Đăng nhập tài khoản Zalo thông qua nút "Đăng nhập Zalo"
3. Quản lý tài khoản và thiết lập webhook trong trang "Quản lý tài khoản"
4. Quản lý proxy trong trang "Quản lý Proxy"

## API

### Xác thực API

Tất cả các API đều yêu cầu API key để xác thực. API key được cấu hình trong file `.env`.

```
X-API-Key: your_api_key
```

### Các API chính

- `GET /api/accounts`: Lấy danh sách tài khoản
- `GET /api/webhook-configs`: Lấy tất cả cấu hình webhook
- `GET /api/webhook-config/:ownId`: Lấy cấu hình webhook cho một tài khoản
- `POST /api/webhook-config/:ownId`: Cập nhật cấu hình webhook cho một tài khoản
- `DELETE /api/webhook-config/:ownId`: Xóa cấu hình webhook cho một tài khoản
- `GET /api/status`: Kiểm tra trạng thái kết nối của hệ thống

## Tích hợp với n8n

MultiZlogin được thiết kế để tích hợp dễ dàng với n8n để tự động hóa quy trình làm việc.

1. Tạo Webhook Node trong n8n
2. Cấu hình webhook URL trong MultiZlogin để trỏ đến URL của Webhook Node
3. Các sự kiện từ Zalo sẽ được gửi đến n8n để xử lý

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng mở issue hoặc pull request để cải thiện dự án.

## Giấy phép

[MIT](LICENSE)

## Tuyên bố trách nhiệm

Dự án này được phát triển với mục đích nghiên cứu và học tập. Người dùng chịu hoàn toàn trách nhiệm khi sử dụng dự án này phải tuân thủ các điều khoản dịch vụ của Zalo và các quy định pháp luật hiện hành. Chúng tôi không chịu trách nhiệm cho bất kỳ hành vi vi phạm nào.

## Lời cảm ơn

Chân thành cảm ơn đội ngũ ZCA đã phát triển thư viện zca-js, giúp chúng tôi có thể xây dựng dự án này.