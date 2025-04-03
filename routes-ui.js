import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { zaloAccounts, loginZaloAccount } from './api/zalo/zalo.js';
import { proxyService } from './proxyService.js';
import dotenv from 'dotenv';

const router = express.Router();

// Dành cho ES Module: xác định __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/', (req, res) => {
    res.send(`
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Zalo server</title>
  </head>
  <body>
    <h1>Zalo server - Đăng nhập qua QR Code với Proxy</h1>
    <p><strong>(Mỗi Proxy tối đa 3 tài khoản)</strong></p>
    
    <h2>CÁCH CÀI GIỚI HẠN GỬI NGƯỜI LẠ ZALO:</h2>
    <ul>
      <li><strong>Thời gian nghỉ</strong> giữa 2 lần gửi tin nhắn (dòng 1): <em>60 - 150 giây</em></li>
      <li><strong>Giới hạn gửi tin nhắn</strong> trong ngày (dòng 2):
        <ul>
          <li>TK Zalo lâu năm, trên 1 năm, chưa từng bị hạn chế: Chỉnh <strong>30</strong> (sau đó tăng dần, mỗi 3 ngày, tăng +20, tối đa 150).</li>
          <li>TK Zalo mới tạo: Chỉ nên <strong>10 - 30</strong> tin nhắn / nick.</li>
        </ul>
      </li>
      <li><strong>Giới hạn lượt tìm số điện thoại</strong> trong 1 tiếng:
        <ul>
          <li>TK cá nhân: 15 tin nhắn trong 60 phút.</li>
          <li>TK business: 30 tin nhắn trong 60 phút.</li>
        </ul>
      </li>
      <li><strong>Khi chạy kết bạn</strong>: 
        <ul>
          <li>Không nên vượt quá <strong>30 - 35 người/ngày</strong> với tài khoản cá nhân.</li>
          <li>Nếu đang chạy gửi tin nhắn nhiều, nên tách riêng quá trình kết bạn để tránh giới hạn.</li>
        </ul>
      </li>
    </ul>
  </body>
  </html>
    `);
  });
  

// Hiển thị form đăng nhập
router.get('/zalo-login', (req, res) => {
    const loginFile = path.join(__dirname, 'login.html');
    fs.readFile(loginFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file login.html:', err);
        return res.status(500).send('Không thể tải trang đăng nhập.');
      }
      res.send(data);
    });
});

// Xử lý đăng nhập: sử dụng proxy do người dùng nhập nếu hợp lệ, nếu không sẽ sử dụng proxy mặc định
let loginResolve;
router.post('/zalo-login', async (req, res) => {
    try {
        const { proxy } = req.body;
        const qrCodeImage = await loginZaloAccount(proxy, null);
        res.send(`
            <html>
               <head>
                  <meta charset="UTF-8">
                  <meta charset="UTF-8">
                  <title>Quét mã QR</title>
               </head>
               <body>
                  <h2>Quét mã QR để đăng nhập</h2>
                  <img src="${qrCodeImage}" alt="QR Code"/>
                  <script>
                      const socket = new WebSocket('ws://localhost:3000');
                      socket.onmessage = function(event) {
                            console.log(event.data)
                          if (event.data === 'login_success') {
                              document.body.innerHTML = \`
                                  <h2>Đăng nhập thành công!</h2>
                                  <p style='color: green;'><b>Đăng nhập thành công!</b></p>
                              \`;
                          }
                      };
                  </script>
               </body>
            </html>
         `);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Hiển thị form cập nhật webhook URL
router.get('/updateWebhookForm', (req, res) => {
    const docFile = path.join(__dirname, 'updateWebhookForm.html');
    fs.readFile(docFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file tài liệu:', err);
        return res.status(500).send('Không thể tải tài liệu API.');
      }
      res.send(data);
    });
  });

// Endpoint hiển thị tài liệu API (đọc file api-doc.html)
router.get('/list', (req, res) => {
    const docFile = path.join(__dirname, 'api-doc.html');
    fs.readFile(docFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file tài liệu:', err);
        return res.status(500).send('Không thể tải tài liệu API.');
      }
      res.send(data);
    });
  });

// Lấy danh sách tài khoản đã đăng nhập
router.get('/accounts', (req, res) => {
    if (zaloAccounts.length === 0) {
        return res.json({ success: true, message: 'Chưa có tài khoản nào đăng nhập' });
    }
    const accounts = zaloAccounts.map(account => ({
        ownId: account.ownId,
        proxy: account.proxy,
        phoneNumber: account.phoneNumber || 'N/A',
    }));
    

    // Tạo bảng HTML
    let html = '<table border="1">';
    html += '<thead><tr>';
    const headers = ['Own ID', 'Phone Number', 'Proxy'];
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    accounts.forEach((account) => {
        html += '<tr>';
        html += `<td>${account.ownId}</td>`;
        html += `<td>${account.phoneNumber || 'N/A'}</td>`;
        html += `<td>${account.proxy}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';
    

    res.send(html);
});

// Endpoint cập nhật 3 webhook URL
router.post('/updateWebhook', (req, res) => {
  const { messageWebhookUrl, groupEventWebhookUrl, reactionWebhookUrl } = req.body;
  // Kiểm tra tính hợp lệ của từng URL
  if (!messageWebhookUrl || !messageWebhookUrl.startsWith("http")) {
      return res.status(400).json({ success: false, error: 'messageWebhookUrl không hợp lệ' });
  }
  if (!groupEventWebhookUrl || !groupEventWebhookUrl.startsWith("http")) {
      return res.status(400).json({ success: false, error: 'groupEventWebhookUrl không hợp lệ' });
  }
  if (!reactionWebhookUrl || !reactionWebhookUrl.startsWith("http")) {
      return res.status(400).json({ success: false, error: 'reactionWebhookUrl không hợp lệ' });
  }
  
  // Update process.env variables
  process.env.MESSAGE_WEBHOOK_URL = messageWebhookUrl;
  process.env.GROUP_EVENT_WEBHOOK_URL = groupEventWebhookUrl;
  process.env.REACTION_WEBHOOK_URL = reactionWebhookUrl;
  
  // Function to update or add a key in the .env content
  const updateEnvVar = (content, key, value) => {
    const regex = new RegExp(`^${key}=.*`, 'gm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(content)) {
      return content.replace(regex, newLine);
    } else {
      return content + (content && !content.endsWith('\n') ? '\n' : '') + newLine + '\n';
    }
  };
  
  // Update root .env file
  const rootEnvPath = path.join(process.cwd(), '.env');
  let rootEnvContent = '';
  
  // Read existing .env content if it exists
  if (fs.existsSync(rootEnvPath)) {
    rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
  }
  
  // Update all three webhook URLs
  rootEnvContent = updateEnvVar(rootEnvContent, 'MESSAGE_WEBHOOK_URL', messageWebhookUrl);
  rootEnvContent = updateEnvVar(rootEnvContent, 'GROUP_EVENT_WEBHOOK_URL', groupEventWebhookUrl);
  rootEnvContent = updateEnvVar(rootEnvContent, 'REACTION_WEBHOOK_URL', reactionWebhookUrl);
  
  // Also update Docker volume .env file
  const dockerEnvPath = path.join(process.cwd(), 'zalo_data', '.env');
  let dockerEnvContent = '';
  
  // Read existing Docker .env content if it exists
  if (fs.existsSync(dockerEnvPath)) {
    dockerEnvContent = fs.readFileSync(dockerEnvPath, 'utf8');
  }
  
  // Update all three webhook URLs in Docker .env
  dockerEnvContent = updateEnvVar(dockerEnvContent, 'MESSAGE_WEBHOOK_URL', messageWebhookUrl);
  dockerEnvContent = updateEnvVar(dockerEnvContent, 'GROUP_EVENT_WEBHOOK_URL', groupEventWebhookUrl);
  dockerEnvContent = updateEnvVar(dockerEnvContent, 'REACTION_WEBHOOK_URL', reactionWebhookUrl);
  
  // Write to both .env files
  try {
    fs.writeFileSync(rootEnvPath, rootEnvContent);
    fs.writeFileSync(dockerEnvPath, dockerEnvContent);
    res.json({ success: true, message: 'Webhook URLs đã được cập nhật' });
  } catch (err) {
    console.error("Lỗi khi ghi file .env:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API quản lý proxy
// Lấy danh sách proxy hiện có
router.get('/proxies', (req, res) => {
  res.json({ success: true, data: proxyService.getPROXIES() });
});

// Thêm một proxy mới
router.post('/proxies', (req, res) => {
  const { proxyUrl } = req.body;
  if (!proxyUrl) {
      return res.status(400).json({ success: false, error: 'proxyUrl không hợp lệ' });
  }
  try {
      const newProxy = proxyService.addProxy(proxyUrl);
      res.json({ success: true, data: newProxy });
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
});

// Xóa một proxy
router.delete('/proxies', (req, res) => {
  const { proxyUrl } = req.body;
  if (!proxyUrl) {
      return res.status(400).json({ success: false, error: 'proxyUrl không hợp lệ' });
  }
  try {
      proxyService.removeProxy(proxyUrl);
      res.json({ success: true, message: 'Xóa proxy thành công' });
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
});

export default router;