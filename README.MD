# Zalo Server

Hệ thống quản lý và tự động hóa tài khoản Zalo với hỗ trợ đăng nhập qua QR Code, quản lý proxy và tích hợp webhook.

## Tính năng

- Đăng nhập nhiều tài khoản Zalo qua QR Code
- Hỗ trợ proxy để tránh bị chặn
- Webhook tích hợp cho tin nhắn, sự kiện nhóm và reaction
- API để tương tác với Zalo
- Giới hạn gửi tin nhắn tự động để tránh bị chặn tài khoản
- Tự động đăng nhập lại từ cookie đã lưu
- Quản lý nhiều tài khoản Zalo cùng lúc
- Hệ thống xác thực và quản lý người dùng

## Cài đặt

### Yêu cầu hệ thống

- Node.js (v14 hoặc cao hơn)
- Docker và Docker Compose (nếu sử dụng Docker)

### Cài đặt local

1. Clone repository:
```bash
git clone https://github.com/CangPham/multizlogin.git
cd multizlogin
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env trong thư mục gốc:
```
MESSAGE_WEBHOOK_URL=https://your-webhook-url.com/message
GROUP_EVENT_WEBHOOK_URL=https://your-webhook-url.com/group
REACTION_WEBHOOK_URL=https://your-webhook-url.com/reaction
PORT=3000
```

4. Chạy server:
```bash
npm start
```

### Cài đặt với Docker

1. Clone repository:
```bash
git clone https://github.com/CangPham/multizlogin.git
cd multizlogin
```

2. Tạo file .env từ file .env.example:
```bash
# Xóa file .env cũ nếu có
rm -f .env
# Copy file .env.example thành .env
cp .env.example .env
# Chỉnh sửa file .env với thông tin webhook của bạn
nano .env
```

3. Chạy script chuẩn bị:
```bash
chmod +x prepare-docker.sh
./prepare-docker.sh
```

4. Cấu hình webhook URL trong file `zalo_data/.env`

5. Khởi động container với Docker Compose:
```bash
docker-compose up -d
```

### Sử dụng image có sẵn từ Docker Hub

1. Tạo môi trường và cấu hình:
```bash
# Clone repository nếu chưa có
git clone https://github.com/CangPham/multizlogin.git
cd multizlogin

# Hoặc tạo thư mục mới nếu muốn cài đặt riêng
mkdir -p zalo-docker
cd zalo-docker

# Xóa file .env cũ nếu có
rm -f .env
# Copy file .env.example thành .env (nếu có repository)
cp .env.example .env
# Hoặc tạo file .env mới
```

2. Thiết lập các file và thư mục cần thiết:
```bash
# Tạo thư mục zalo_data
mkdir -p zalo_data

# Tạo file proxies.json
echo "[]" > ./zalo_data/proxies.json

# Copy file .env vào zalo_data
cp .env ./zalo_data/.env

# Tạo docker-compose.yaml
cat > docker-compose.yaml << EOF
version: "3.3"
services:
  zalo-server:
    image: cangphamdocker/zalo-server:latest
    ports:
      - "3000:3000"
    volumes:
      - type: bind
        source: ./zalo_data
        target: /app/cookies
        consistency: consistent
      - type: bind
        source: ./zalo_data/proxies.json
        target: /app/proxies.json
        consistency: consistent
      - type: bind
        source: ./zalo_data/.env
        target: /app/.env
        consistency: consistent
    environment:
      - PORT=3000
      - MESSAGE_WEBHOOK_URL=\${MESSAGE_WEBHOOK_URL}
      - GROUP_EVENT_WEBHOOK_URL=\${GROUP_EVENT_WEBHOOK_URL}
      - REACTION_WEBHOOK_URL=\${REACTION_WEBHOOK_URL}
    restart: always
    working_dir: /app
EOF

# Khởi động container
docker-compose up -d
```

## Biến môi trường

Hệ thống sử dụng các biến môi trường sau:

| Biến                    | Mô tả                                                 | Ví dụ                                         |
|-------------------------|----------------------------------------------------- |--------------------------------------------- |
| PORT                    | Cổng để chạy server                                  | 3000                                          |
| MESSAGE_WEBHOOK_URL     | URL webhook để gửi thông báo khi có tin nhắn mới     | https://example.com/webhook/zalo-message      |
| GROUP_EVENT_WEBHOOK_URL | URL webhook để gửi thông báo khi có sự kiện nhóm     | https://example.com/webhook/zalo-group-event  |
| REACTION_WEBHOOK_URL    | URL webhook để gửi thông báo khi có reaction         | https://example.com/webhook/zalo-reaction     |

## Quản lý cookie và đăng nhập tự động

Hệ thống tự động lưu cookie sau khi đăng nhập thông qua QR code. Các cookie này được lưu trong thư mục `cookies/` với định dạng `cred_[ownId].json`. Khi khởi động, server sẽ tự động đăng nhập lại các tài khoản từ cookie đã lưu.

Quy trình tự động đăng nhập:
1. Khi server khởi động, nó kiểm tra thư mục cookies
2. Nếu có file cookie, nó sẽ đọc và đăng nhập lại các tài khoản
3. Điều này giúp duy trì phiên đăng nhập ngay cả khi server khởi động lại

## Hướng dẫn sử dụng

### Đăng nhập Zalo

1. Mở trình duyệt và truy cập: `http://localhost:3000/zalo-login`
2. Quét mã QR với ứng dụng Zalo trên điện thoại
3. Sau khi đăng nhập thành công, tài khoản sẽ được lưu và quản lý bởi hệ thống

### Quản lý Proxy

- Thêm proxy mới: `POST /proxies` với body `{"proxyUrl": "http://user:pass@host:port"}`
- Xem danh sách proxy: `GET /proxies`
- Xóa proxy: `DELETE /proxies` với body `{"proxyUrl": "http://user:pass@host:port"}`

### Cấu hình Webhook

Truy cập `http://localhost:3000` và cấu hình webhook URLs. Hệ thống sẽ gửi dữ liệu đến các webhook này khi:
- Có tin nhắn mới (MESSAGE_WEBHOOK_URL)
- Có sự kiện trong nhóm (GROUP_EVENT_WEBHOOK_URL)
- Có reaction trên tin nhắn (REACTION_WEBHOOK_URL)

### Quản lý người dùng

Hệ thống có tích hợp quản lý người dùng với các chức năng:

1. **Đăng nhập quản trị**:
   - Truy cập: `http://localhost:3000/admin-login`
   - Tài khoản mặc định: `admin/admin`

2. **Thêm người dùng mới**:
   - Truy cập: `http://localhost:3000/user-management` (yêu cầu đăng nhập với quyền admin)
   - Điền thông tin người dùng: tên đăng nhập, mật khẩu và chọn vai trò (Người dùng thường/Quản trị viên)
   - Nhấn "Thêm người dùng" để hoàn tất

3. **Xem danh sách người dùng**:
   - Truy cập: `http://localhost:3000/user-management` (yêu cầu đăng nhập với quyền admin)
   - Danh sách người dùng hiển thị ở phần bên phải
   - Nhấn "Làm mới danh sách" để cập nhật thông tin mới nhất

4. **API quản lý người dùng**:
   - `POST /api/users`: Thêm người dùng mới (admin only)
   - `GET /api/users`: Lấy danh sách người dùng (admin only)
   - `POST /api/login`: Đăng nhập
   - `POST /api/logout`: Đăng xuất
   - `POST /api/change-password`: Đổi mật khẩu
   - `GET /api/check-auth`: Kiểm tra phiên đăng nhập

5. **Vai trò người dùng**:
   - **Quản trị viên (admin)**: Có quyền quản lý người dùng, truy cập tất cả tính năng
   - **Người dùng thường (user)**: Chỉ có quyền sử dụng các tính năng cơ bản của hệ thống

Dữ liệu người dùng được lưu trong file `cookies/users.json` và được mã hóa an toàn.

### Giới hạn gửi tin nhắn

Để tránh bị chặn tài khoản Zalo, tuân thủ các giới hạn sau:
- **Thời gian nghỉ** giữa 2 lần gửi tin nhắn: 60-150 giây
- **Giới hạn gửi tin nhắn** trong ngày:
  - TK Zalo lâu năm: 30 tin/ngày (tăng dần, mỗi 3 ngày +20, tối đa 150)
  - TK Zalo mới: 10-30 tin/ngày
- **Giới hạn tìm số điện thoại**:
  - TK cá nhân: 15 tin/60 phút
  - TK business: 30 tin/60 phút
- **Kết bạn**: Không quá 30-35 người/ngày với tài khoản cá nhân

## Cấu trúc thư mục

```
multizlogin/
├── api/
│   └── zalo/             # Mã nguồn tương tác với API Zalo
├── zalo_data/            # Thư mục dữ liệu (cookies, proxies, cấu hình)
├── server.js             # File chính của server
├── routes.js             # Định tuyến chính
├── routes-api.js         # API endpoints
├── routes-ui.js          # UI endpoints
├── helpers.js            # Các hàm tiện ích
├── proxyService.js       # Dịch vụ quản lý proxy
├── auth.js               # Hệ thống xác thực và quản lý người dùng
├── admin-login.html      # Giao diện đăng nhập quản trị
├── user-management.html  # Giao diện quản lý người dùng
├── .env                  # Cấu hình biến môi trường
└── ...
```

## Các API chính

Tham khảo tài liệu API đầy đủ tại: `http://localhost:3000/list`

## Xây dựng Docker Image

```bash
# Xóa file .env cũ trước khi build để tránh lộ thông tin cá nhân
rm -f .env
cp .env.example .env

# Nếu dùng PowerShell trên Windows
# Remove-Item .env -Force
# Copy-Item .env.example .env

# Build image
docker build -t zalo-server .

# Gắn tag
docker tag zalo-server cangphamdocker/zalo-server:latest

# Push lên Docker Hub
docker push cangphamdocker/zalo-server:latest
```

## Gỡ lỗi

- **Lỗi đăng nhập**: Kiểm tra kết nối mạng và proxy
- **Webhook không hoạt động**: Xác nhận URL webhook đã được cấu hình đúng trong file .env
- **Tin nhắn không gửi được**: Kiểm tra giới hạn gửi tin nhắn và chờ thời gian nghỉ
- **Cookie không hoạt động**: Xóa cookie cũ trong thư mục cookies và đăng nhập lại

## Tác giả

- [Phạm Sỹ Cang](https://github.com/CangPham)

## Lời cảm ơn

Dự án này không thể thực hiện được nếu không có những đóng góp quý báu từ cộng đồng. Tôi muốn gửi lời cảm ơn chân thành đến:

### Team ZCA

Xin gửi lời cảm ơn đặc biệt đến team ZCA đã phát triển thư viện [zca-js](https://github.com/RFS-ADRENO/zca-js) - nền tảng cốt lõi để dự án này có thể tương tác với Zalo. 

Team ZCA đã thực hiện công việc đáng kinh ngạc trong việc nghiên cứu và tìm hiểu cách thức hoạt động của Zalo, đồng thời phát triển một thư viện mạnh mẽ cho phép tương tác theo chương trình với nền tảng này. Mặc dù đây là một thư viện không chính thức, nhưng chất lượng và tính ổn định của thư viện đã cho phép tôi xây dựng dự án này một cách hiệu quả.

Nếu bạn quan tâm đến công việc của team ZCA, hãy ghé thăm: 
- GitHub: [https://github.com/RFS-ADRENO](https://github.com/RFS-ADRENO)
- Thư viện zca-js: [https://github.com/RFS-ADRENO/zca-js](https://github.com/RFS-ADRENO/zca-js)

Trân trọng và ghi nhận những nỗ lực đáng kinh ngạc của họ!

## Miễn trừ trách nhiệm

**Lưu ý quan trọng:**

Dự án này sử dụng thư viện không chính thức (unofficial) từ team ZCA và tương tác với Zalo API thông qua các phương thức không được Zalo hỗ trợ chính thức.

1. **Không phải là sản phẩm chính thức:** Đây KHÔNG phải là sản phẩm được phát triển hoặc phê duyệt bởi Zalo. Đây là dự án cá nhân sử dụng kỹ thuật reverse engineering.

2. **Rủi ro sử dụng:** Việc sử dụng các API không chính thức có thể dẫn đến:
   - Tài khoản Zalo bị khóa tạm thời hoặc vĩnh viễn
   - Ngắt kết nối đột ngột do thay đổi từ phía Zalo
   - Lỗ hổng bảo mật tiềm ẩn
   - Hoạt động không ổn định khi Zalo cập nhật nền tảng của họ

3. **Giới hạn và tuân thủ:** Người dùng nên:
   - Tuân thủ nghiêm ngặt các giới hạn gửi tin nhắn được đề cập trong tài liệu
   - Không sử dụng cho mục đích spam hoặc lạm dụng dịch vụ Zalo
   - Chỉ sử dụng cho mục đích cá nhân hoặc phát triển

4. **Không hỗ trợ thương mại:** Dự án này được cung cấp "nguyên trạng" mà không có bảo đảm dưới bất kỳ hình thức nào, rõ ràng hay ngụ ý.

5. **Thư viện bên thứ ba:** Dự án này sử dụng thư viện zca-js từ team ZCA. Chúng tôi ghi nhận và đánh giá cao công việc của họ, nhưng không chịu trách nhiệm về bất kỳ vấn đề nào phát sinh từ việc sử dụng thư viện này.

Bằng việc sử dụng dự án này, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với tất cả các điều khoản miễn trừ trách nhiệm nêu trên.

## License

MIT