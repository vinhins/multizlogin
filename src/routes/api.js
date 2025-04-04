import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    findUser, 
    getUserInfo, 
    sendFriendRequest, 
    sendMessage,
    createGroup, 
    getGroupInfo, 
    addUserToGroup, 
    removeUserFromGroup,
    sendImageToUser,
    sendImagesToUser,
    sendImageToGroup,
    sendImagesToGroup
} from '../api/zalo/zalo.js';
import { validateUser, adminMiddleware, addUser, getAllUsers, changePassword } from '../services/authService.js';
import { 
    getWebhookUrl, 
    setWebhookUrl, 
    removeWebhookConfig, 
    getAllWebhookConfigs 
} from '../services/webhookService.js';

const router = express.Router();

// Dành cho ES Module: xác định __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API xác thực
// Đăng nhập
router.post('/login', (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
    }
    
    const user = validateUser(username, password);
    console.log('User validation result:', user);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }
    
    // Kiểm tra req.session tồn tại
    if (!req.session) {
      console.error('Session object is not available!');
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi server: session không khả dụng',
        debug: 'req.session is undefined'
      });
    }
    
    // Thiết lập session
    req.session.authenticated = true;
    req.session.username = user.username;
    req.session.role = user.role;
    
    console.log('Login successful, session set:', {
      authenticated: req.session.authenticated,
      username: req.session.username,
      role: req.session.role
    });
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi xử lý đăng nhập', 
      error: error.message 
    });
  }
});

// Đăng xuất
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
    }
    res.json({ success: true, message: 'Đã đăng xuất thành công' });
  });
});

// Lấy thông tin người dùng hiện tại
router.get('/user', (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }
  
  res.json({
    success: true,
    user: {
      username: req.session.username,
      role: req.session.role
    }
  });
});

// API quản lý người dùng (chỉ admin)
// Lấy danh sách người dùng
router.get('/users', adminMiddleware, (req, res) => {
  const users = getAllUsers();
  res.json({ success: true, users });
});

// Thêm người dùng mới
router.post('/users', adminMiddleware, (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
  }
  
  const success = addUser(username, password, role || 'user');
  if (!success) {
    return res.status(400).json({ success: false, message: 'Tài khoản đã tồn tại' });
  }
  
  res.json({ success: true, message: 'Đã thêm người dùng thành công' });
});

// Đổi mật khẩu
router.post('/change-password', (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }
  
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
  }
  
  const success = changePassword(req.session.username, oldPassword, newPassword);
  if (!success) {
    return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
  }
  
  res.json({ success: true, message: 'Đã đổi mật khẩu thành công' });
});

// Kiểm tra phiên đăng nhập
router.get('/check-auth', (req, res) => {
  if (req.session.authenticated) {
    return res.json({ 
      authenticated: true, 
      username: req.session.username,
      role: req.session.role
    });
  }
  
  res.json({ authenticated: false });
});

// API đăng nhập đơn giản (không dùng file users.json)
router.post('/simple-login', (req, res) => {
  try {
    console.log('Simple login attempt:', req.body);
    
    // Đảm bảo có dữ liệu hợp lệ
    if (!req.body || typeof req.body !== 'object') {
      console.error('Invalid request body:', req.body);
      const errorResponse = { success: false, message: 'Dữ liệu không hợp lệ' };
      console.log('Sending 400 response (invalid body):', JSON.stringify(errorResponse)); // Log before return
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json(errorResponse);
    }
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      const errorResponse = { success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' };
      console.log('Sending 400 response (missing credentials):', JSON.stringify(errorResponse)); // Log before return
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json(errorResponse);
    }
    
    // Kiểm tra session object
    console.log('Session before login:', req.session ? 'exists' : 'missing');
    
    // Chỉ kiểm tra tài khoản admin/admin
    if (username === 'admin' && password === 'admin') {
      // Xử lý trường hợp không có req.session
      if (!req.session) {
        console.error('Session object is not available - missing session middleware?');
        const errorResponse = { success: false, message: 'Lỗi server: session không khả dụng' };
        console.log('Sending 500 response (session missing):', JSON.stringify(errorResponse)); // Log before return
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json(errorResponse);
      }

      // Thiết lập session thủ công và trả về ngay lập tức
      req.session.authenticated = true;
      req.session.username = 'admin';
      req.session.role = 'admin';
      
      console.log('Session set, returning response immediately');
      
      const successResponse = {
        success: true,
        user: { username: 'admin', role: 'admin' },
        sessionID: req.sessionID || 'unknown'
      };
      console.log('Sending 200 response (login success):', JSON.stringify(successResponse)); // Log before return
      res.setHeader('Content-Type', 'application/json');
      return res.json(successResponse);
    } else {
      const errorResponse = { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' };
      console.log('Sending 401 response (invalid credentials):', JSON.stringify(errorResponse)); // Log before return
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json(errorResponse);
    }
  } catch (error) {
    console.error('Simple login error:', error);
    // Luôn đảm bảo trả về JSON
    const errorResponse = {
      success: false,
      message: 'Lỗi server',
      error: error.message || 'Unknown error'
    };
    console.log('Sending 500 response (catch block):', JSON.stringify(errorResponse)); // Log before return
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json(errorResponse);
  }
});

// Giữ nguyên API cũ
router.post('/findUser', findUser);
router.post('/getUserInfo', getUserInfo);
router.post('/sendFriendRequest', sendFriendRequest);
router.post('/sendmessage', sendMessage);
router.post('/createGroup', createGroup);
router.post('/getGroupInfo', getGroupInfo);
router.post('/addUserToGroup', addUserToGroup);
router.post('/removeUserFromGroup', removeUserFromGroup);
router.post('/sendImageToUser', sendImageToUser);
router.post('/sendImagesToUser', sendImagesToUser);
router.post('/sendImageToGroup', sendImageToGroup);
router.post('/sendImagesToGroup', sendImagesToGroup);

// API kiểm tra trạng thái session
router.get('/session-test', (req, res) => {
  try {
    // Kiểm tra session object có tồn tại không
    const hasSession = !!req.session;
    
    // Lấy thông tin session hiện tại
    const sessionInfo = {
      exists: hasSession,
      id: req.sessionID || 'no-session-id',
      isAuthenticated: hasSession && req.session.authenticated === true,
      username: hasSession ? (req.session.username || 'none') : 'no-session',
      role: hasSession ? (req.session.role || 'none') : 'no-session',
      cookieSettings: hasSession ? {
        maxAge: req.session.cookie.maxAge,
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        path: req.session.cookie.path
      } : 'no-cookie'
    };
    
    // Trả về thông tin
    return res.json({
      success: true,
      message: 'Session test',
      sessionInfo
    });
  } catch (error) {
    console.error('Session test error:', error);
    return res.json({
      success: false,
      message: 'Lỗi khi kiểm tra session',
      error: error.message || 'Unknown error'
    });
  }
});

// Thêm một API đăng nhập đơn giản mới để test - simplified
router.post('/test-login', (req, res) => {
  console.log('Test login received:', req.body);
  
  try {
    const { username, password } = req.body || {};
    
    console.log(`Login attempt: username=${username}, password=${typeof password === 'string' ? 'provided' : 'missing'}`);
    console.log('Session info:', req.session ? 'session exists' : 'no session', req.sessionID || 'no session ID');
    
    // Basic validation
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ success: false, message: 'Tài khoản và mật khẩu không được để trống' });
    }
    
    // Simple check
    if (username === 'admin' && password === 'admin') {
      // Set session if available
      if (req.session) {
        req.session.authenticated = true;
        req.session.username = 'admin';
        req.session.role = 'admin';
        
        // Force save session to ensure cookie is set
        req.session.save(err => {
          if (err) {
            console.error('Session save error:', err);
          }
          
          console.log('Session saved:', req.sessionID);
          
          // Success response with session ID
          return res.json({ 
            success: true, 
            user: { username: 'admin', role: 'admin' },
            sessionID: req.sessionID,
            message: 'Đăng nhập thành công'
          });
        });
      } else {
        console.error('No session object available');
        return res.json({ 
          success: true, 
          user: { username: 'admin', role: 'admin' },
          sessionAvailable: false,
          message: 'Đăng nhập thành công, nhưng session không khả dụng'
        });
      }
    } else {
      // Invalid credentials
      console.log('Invalid credentials');
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    console.error('Error in test-login:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// API test JSON đơn giản
router.post('/test-json', (req, res) => {
  // Trả về chính xác request body được gửi lên
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    success: true,
    message: 'Test JSON thành công',
    receivedData: req.body || null
  });
});

// API quản lý webhook URLs theo số điện thoại

// Endpoint để lấy tất cả cấu hình webhook
router.get('/account-webhooks', (req, res) => {
    try {
        const webhookConfigs = getAllWebhookConfigs();
        res.json({ success: true, data: webhookConfigs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint để lấy cấu hình webhook của một tài khoản
router.get('/account-webhook/:ownId', (req, res) => {
    try {
        const { ownId } = req.params;
        
        if (!ownId) {
            return res.status(400).json({ success: false, error: 'ownId là bắt buộc' });
        }
        
        const messageWebhookUrl = getWebhookUrl('messageWebhookUrl', ownId);
        const groupEventWebhookUrl = getWebhookUrl('groupEventWebhookUrl', ownId);
        const reactionWebhookUrl = getWebhookUrl('reactionWebhookUrl', ownId);
        
        res.json({
            success: true,
            data: {
                ownId,
                messageWebhookUrl,
                groupEventWebhookUrl,
                reactionWebhookUrl
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint để thiết lập webhook URL cho một tài khoản cụ thể
router.post('/account-webhook', (req, res) => {
    try {
        const { ownId, messageWebhookUrl, groupEventWebhookUrl, reactionWebhookUrl } = req.body;
        
        if (!ownId) {
            return res.status(400).json({ success: false, error: 'ownId là bắt buộc' });
        }
        
        let success = true;
        
        // Thiết lập từng loại webhook URL nếu được cung cấp
        if (messageWebhookUrl !== undefined) {
            success = success && setWebhookUrl(ownId, 'messageWebhookUrl', messageWebhookUrl);
        }
        
        if (groupEventWebhookUrl !== undefined) {
            success = success && setWebhookUrl(ownId, 'groupEventWebhookUrl', groupEventWebhookUrl);
        }
        
        if (reactionWebhookUrl !== undefined) {
            success = success && setWebhookUrl(ownId, 'reactionWebhookUrl', reactionWebhookUrl);
        }
        
        if (success) {
            res.json({ success: true, message: 'Đã cập nhật webhook URLs cho tài khoản' });
        } else {
            res.status(500).json({ success: false, error: 'Lỗi khi cập nhật webhook URLs' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint để xóa cấu hình webhook của một tài khoản
router.delete('/account-webhook/:ownId', (req, res) => {
    try {
        const { ownId } = req.params;
        
        if (!ownId) {
            return res.status(400).json({ success: false, error: 'ownId là bắt buộc' });
        }
        
        if (removeWebhookConfig(ownId)) {
            res.json({ success: true, message: 'Đã xóa cấu hình webhook cho tài khoản' });
        } else {
            res.status(500).json({ success: false, error: 'Lỗi khi xóa cấu hình webhook' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint debug để kiểm tra trạng thái webhookConfig
router.get('/debug-webhook-config', (req, res) => {
    try {
        const webhookConfigs = getAllWebhookConfigs();
        const fileExists = fs.existsSync(path.join(__dirname, 'webhookConfig.json'));
        
        res.json({
            success: true,
            configExists: !!webhookConfigs,
            fileExists: fileExists,
            data: webhookConfigs,
            dirname: __dirname,
            configPath: path.join(__dirname, 'webhookConfig.json')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

export default router;