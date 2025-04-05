// auth.js - Quản lý xác thực người dùng
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến file lưu thông tin đăng nhập
const userFilePath = path.join(process.cwd(), 'data', 'cookies', 'users.json');
console.log("Path to users.json:", userFilePath); // Log để debug

// Tạo file users.json nếu chưa tồn tại
const initUserFile = () => {
  try {
    console.log("Khởi tạo file người dùng...");
    
    // Kiểm tra và tạo thư mục cookies nếu chưa tồn tại
    const cookiesDir = path.join(process.cwd(), 'data', 'cookies');
    if (!fs.existsSync(cookiesDir)) {
      console.log("Thư mục cookies không tồn tại, đang tạo...");
      fs.mkdirSync(cookiesDir, { recursive: true });
      console.log("Đã tạo thư mục cookies thành công");
    } else {
      console.log("Thư mục cookies đã tồn tại");
    }
    
    // Đường dẫn đầy đủ đến file users.json
    console.log("Đường dẫn file users.json:", userFilePath);
    
    // Kiểm tra file users.json
    if (!fs.existsSync(userFilePath)) {
      console.log("File users.json không tồn tại, đang tạo...");
      
      // Tạo mật khẩu mặc định 'admin' cho người dùng 'admin'
      const defaultPassword = 'admin';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(defaultPassword, salt, 1000, 64, 'sha512').toString('hex');
      
      const users = [{
        username: 'admin',
        salt,
        hash,
        role: 'admin' // Thêm quyền admin
      }];
      
      // Tạo file users.json
      const jsonData = JSON.stringify(users, null, 2);
      console.log("Dữ liệu JSON sẽ được ghi:", jsonData);
      
      fs.writeFileSync(userFilePath, jsonData);
      console.log('Đã tạo file users.json với tài khoản mặc định: admin/admin');
    } else {
      console.log("File users.json đã tồn tại");
      // Kiểm tra nội dung file
      try {
        const content = fs.readFileSync(userFilePath, 'utf8');
        console.log("Nội dung file users.json:", content.slice(0, 100) + "...");
        JSON.parse(content); // Kiểm tra xem có phải JSON hợp lệ
        console.log("users.json là JSON hợp lệ");
      } catch (readError) {
        console.error("Lỗi khi đọc/phân tích file users.json:", readError);
        // Nếu file không đúng định dạng JSON, tạo lại
        const defaultPassword = 'admin';
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(defaultPassword, salt, 1000, 64, 'sha512').toString('hex');
        
        const users = [{
          username: 'admin',
          salt,
          hash,
          role: 'admin'
        }];
        
        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
        console.log('Đã tạo lại file users.json với tài khoản mặc định: admin/admin');
      }
    }
  } catch (error) {
    console.error("Lỗi trong quá trình khởi tạo file người dùng:", error);
  }
};

// Khởi tạo file người dùng
initUserFile();

// Đọc dữ liệu người dùng từ file
const getUsers = () => {
  try {
    const data = fs.readFileSync(userFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Lỗi khi đọc file users.json:', error);
    return [];
  }
};

// Thêm người dùng mới
export const addUser = (username, password, role = 'user') => {
  const users = getUsers();
  
  // Kiểm tra nếu username đã tồn tại
  if (users.some(user => user.username === username)) {
    return false;
  }
  
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  
  users.push({
    username,
    salt,
    hash,
    role
  });
  
  fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
  return true;
};

// Xác thực người dùng và trả về thông tin user
export const validateUser = (username, password) => {
  const users = getUsers();
  const user = users.find(user => user.username === username);
  
  if (!user) {
    return null;
  }
  
  const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
  if (user.hash === hash) {
    return {
      username: user.username,
      role: user.role || 'user'
    };
  }
  
  return null;
};

// Thay đổi mật khẩu
export const changePassword = (username, oldPassword, newPassword) => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.username === username);
  
  if (userIndex === -1) {
    return false;
  }
  
  const user = users[userIndex];
  const hash = crypto.pbkdf2Sync(oldPassword, user.salt, 1000, 64, 'sha512').toString('hex');
  
  if (user.hash !== hash) {
    return false; // Mật khẩu cũ không chính xác
  }
  
  // Cập nhật mật khẩu mới
  const salt = crypto.randomBytes(16).toString('hex');
  const newHash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
  
  users[userIndex].salt = salt;
  users[userIndex].hash = newHash;
  
  fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
  return true;
};

// Middleware xác thực cho các route
export const authMiddleware = (req, res, next) => {
  // Kiểm tra nếu đã đăng nhập (thông qua session)
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // Chuyển hướng về trang đăng nhập
  res.redirect('/admin-login');
};

// Middleware kiểm tra quyền admin
export const adminMiddleware = (req, res, next) => {
  if (req.session && req.session.authenticated && req.session.role === 'admin') {
    return next();
  }
  
  res.status(403).send('Không có quyền truy cập. Chỉ admin mới có thể thực hiện chức năng này.');
};

// Lấy toàn bộ danh sách người dùng (chỉ admin mới có quyền)
export const getAllUsers = () => {
  const users = getUsers();
  return users.map(user => ({
    username: user.username,
    role: user.role || 'user'
  }));
};

// Danh sách các route công khai (không cần xác thực)
export const publicRoutes = [
  '/', // Trang chủ hiển thị nút đăng nhập
  '/admin-login', // Trang đăng nhập
  '/session-test', // Trang kiểm tra session
  '/api/login', // API đăng nhập
  '/api/simple-login', // API đăng nhập đơn giản
  '/api/test-login', // API đăng nhập test
  '/api/logout', // API đăng xuất
  '/api/check-auth', // API kiểm tra trạng thái xác thực
  '/api/session-test', // API kiểm tra session
  '/api/test-json', // API test JSON
  '/api/account-webhook/', // API webhook có tham số
  '/favicon.ico', // Favicon
  '/ws', // WebSocket
  
  // Thêm các API Zalo không cần xác thực
  '/api/findUser',
  '/api/getUserInfo',
  '/api/sendFriendRequest',
  '/api/sendmessage',
  '/api/createGroup',
  '/api/getGroupInfo',
  '/api/addUserToGroup',
  '/api/removeUserFromGroup',
  '/api/sendImageToUser',
  '/api/sendImagesToUser',
  '/api/sendImageToGroup',
  '/api/sendImagesToGroup'
];

// Kiểm tra xem route có phải là public hay không
export const isPublicRoute = (path) => {
  console.log('Checking if route is public:', path);
  
  // Kiểm tra các route API công khai
  if (path.startsWith('/api/')) {
    // Xử lý các route có tham số động
    if (path.startsWith('/api/account-webhook/')) {
      console.log('Is account webhook API with parameters:', true);
      return true;
    }
    
    // Kiểm tra các route cụ thể trong danh sách publicRoutes
    for (const route of publicRoutes) {
      if (route.startsWith('/api/') && (
        path === route || // Trùng khớp chính xác
        (route.endsWith('/') && path.startsWith(route)) // Route kết thúc bằng / và path bắt đầu bằng route
      )) {
        console.log('Is public API route:', true);
        return true;
      }
    }
    
    console.log('Is public API route:', false);
    return false;
  }
  
  // Kiểm tra các route UI công khai
  for (const route of publicRoutes) {
    // Bỏ qua các route API
    if (route.startsWith('/api/')) continue;
    
    // Kiểm tra exact match
    if (path === route) {
      console.log('Is public UI route (exact match):', true);
      return true;
    }
    
    // Kiểm tra prefix match cho routes như /route/*
    if (route.endsWith('*') && path.startsWith(route.slice(0, -1))) {
      console.log('Is public UI route (prefix match):', true);
      return true;
    }
  }
  
  console.log('Is public route:', false);
  return false;
}; 