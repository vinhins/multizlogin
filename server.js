// server.js
import express from 'express';
import routes from './routes.js';
import fs from 'fs';
import { zaloAccounts, loginZaloAccount } from './api/zalo/zalo.js';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authMiddleware, isPublicRoute } from './auth.js';
import { loadWebhookConfig } from './webhookConfig.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Tải cấu hình webhook từ file
loadWebhookConfig();
console.log("Đã tải cấu hình webhook");

// Thiết lập middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Dùng để parse dữ liệu form
app.use(cookieParser());

// Định nghĩa SESSION_SECRET từ biến môi trường hoặc mặc định
const sessionSecret = process.env.SESSION_SECRET || 'zalo-server-secret-key';
console.log("Using session secret:", sessionSecret ? "Configured properly" : "MISSING SESSION SECRET");

// Thiết lập session với cấu hình rõ ràng hơn
app.use(session({
  secret: sessionSecret,
  resave: false, // Không lưu lại session nếu không có thay đổi
  saveUninitialized: false, // Không lưu session nếu chưa có dữ liệu
  name: 'zalo-server.sid', // Tên cookie cụ thể
  cookie: { 
    secure: false, // Đổi thành false để hoạt động với HTTP
    httpOnly: true, // Chỉ truy cập được qua HTTP, không qua JS
    maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    path: '/'
  }
}));

// Log để debug session
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Session exists:', !!req.session);
  next();
});

// Middleware xác thực cho tất cả các route trừ những route công khai
app.use((req, res, next) => {
  // Bỏ qua xác thực cho các API route và các route công khai
  if (isPublicRoute(req.path)) {
    console.log(`Skipping auth for public route: ${req.path}`);
    return next();
  }
  
  // Áp dụng middleware xác thực cho các route khác
  console.log(`Applying auth middleware for protected route: ${req.path}`);
  authMiddleware(req, res, next);
});

// Thiết lập route
app.use('/', routes);

// Login từ cookie đã lưu
const cookiesDir = './cookies';
if (fs.existsSync(cookiesDir)) {
    const cookieFiles = fs.readdirSync(cookiesDir);
    if (zaloAccounts.length < cookieFiles.length) {
        console.log('Số lượng tài khoản Zalo nhỏ hơn số lượng cookie files. Đang đăng nhập lại từ cookie...');
        for (const file of cookieFiles) {
            if (file.startsWith('cred_') && file.endsWith('.json')) {
                const ownId = file.substring(5, file.length - 5, file.length);
                try {
                    const cookie = JSON.parse(fs.readFileSync(`${cookiesDir}/${file}`, "utf-8"));
                    await loginZaloAccount(null, cookie);
                    console.log(`Đã đăng nhập lại tài khoản ${ownId} từ cookie.`);
                } catch (error) {
                    console.error(`Lỗi khi đăng nhập lại tài khoản ${ownId} từ cookie:`, error);
                }
            }
        }
    }
}

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
