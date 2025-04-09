// app.js
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authMiddleware, isPublicRoute } from './services/authService.js';
import { loadWebhookConfig } from './services/webhookService.js';
import routes from './routes/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { zaloAccounts, loginZaloAccount } from './api/zalo/zalo.js';

// Dành cho ES Module: xác định __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const app = express();

// Cấu hình EJS
app.set('view engine', 'ejs');
const viewsPath = path.join(__dirname, 'views');
console.log('Views path:', viewsPath);
app.set('views', viewsPath);

// Kiểm tra thư mục views
if (fs.existsSync(viewsPath)) {
  const files = fs.readdirSync(viewsPath);
  console.log('Views directory exists. Files:', files);
} else {
  console.error('Views directory does not exist at', viewsPath);
  // Nếu không tồn tại, thử tạo thư mục
  try {
    fs.mkdirSync(viewsPath, { recursive: true });
    console.log('Created views directory at', viewsPath);
  } catch (error) {
    console.error('Failed to create views directory:', error);
  }
}

// Tải cấu hình webhook từ file
loadWebhookConfig();
console.log("Đã tải cấu hình webhook");

// Thiết lập middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Dùng để parse dữ liệu form
app.use(cookieParser());

// Thiết lập middleware phục vụ file tĩnh
app.use(express.static(path.join(__dirname, 'public')));
console.log('Static files path:', path.join(__dirname, 'public'));

// Định nghĩa SESSION_SECRET từ biến môi trường hoặc mặc định
const sessionSecret = process.env.SESSION_SECRET || 'zalo-server-secret-key';
console.log("Using session secret:", sessionSecret ? "Configured properly" : "MISSING SESSION SECRET");

// Thiết lập session với cấu hình rõ ràng hơn
app.use(session({
  secret: sessionSecret,
  resave: true, // Thay đổi thành true để đảm bảo session được lưu lại sau mỗi request
  saveUninitialized: true, // Thay đổi thành true để đảm bảo session được lưu ngay cả khi chưa có dữ liệu
  name: 'zalo-server.sid', // Tên cookie cụ thể
  cookie: {
    secure: false, // false để hoạt động với HTTP
    httpOnly: true, // Chỉ truy cập được qua HTTP, không qua JS
    maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    path: '/',
    sameSite: 'lax' // Thêm cấu hình sameSite để tránh vấn đề với cross-site
  },
  rolling: true // Session được làm mới mỗi request
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
const cookiesDir = './data/cookies';
if (fs.existsSync(cookiesDir)) {
    try {
        const cookieFiles = fs.readdirSync(cookiesDir);
        if (zaloAccounts.length < cookieFiles.length) {
            console.log('Số lượng tài khoản Zalo nhỏ hơn số lượng cookie files. Đang đăng nhập lại từ cookie...');

            // Sử dụng IIFE để tránh top-level await
            (async function() {
                for (const file of cookieFiles) {
                    if (file.startsWith('cred_') && file.endsWith('.json')) {
                        const ownId = file.substring(5, file.length - 5, file.length);
                        try {
                            const cookiePath = `${cookiesDir}/${file}`;
                            if (fs.existsSync(cookiePath)) {
                                const cookie = JSON.parse(fs.readFileSync(cookiePath, "utf-8"));
                                try {
                                    await loginZaloAccount(null, cookie);
                                    console.log(`Đã đăng nhập lại tài khoản ${ownId} từ cookie.`);
                                } catch (loginError) {
                                    console.error(`Lỗi khi đăng nhập lại tài khoản ${ownId} từ cookie:`, loginError);
                                }
                            } else {
                                console.log(`Không tìm thấy file cookie: ${cookiePath}`);
                            }
                        } catch (error) {
                            console.error(`Lỗi khi đọc/xử lý cookie cho tài khoản ${ownId}:`, error);
                        }
                    }
                }
            })().catch(err => {
                console.error('Lỗi khi xử lý đăng nhập từ cookie:', err);
            });
        }
    } catch (dirError) {
        console.error(`Lỗi khi đọc thư mục cookies:`, dirError);
    }
} else {
    console.log(`Thư mục cookies không tồn tại: ${cookiesDir}`);
    fs.mkdirSync(cookiesDir, { recursive: true });
}

export default app;