// webhookConfig.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến file cấu hình webhook
const webhookConfigPath = path.join(__dirname, 'webhookConfig.json');

// Cấu trúc dữ liệu mặc định
const defaultConfig = {
    // Webhook mặc định từ .env
    default: {
        messageWebhookUrl: process.env.MESSAGE_WEBHOOK_URL || "",
        groupEventWebhookUrl: process.env.GROUP_EVENT_WEBHOOK_URL || "",
        reactionWebhookUrl: process.env.REACTION_WEBHOOK_URL || ""
    },
    // Cấu hình theo ownId
    accounts: {}
};

// Biến lưu trữ cấu hình webhook
let webhookConfig = defaultConfig;

// Hàm đọc cấu hình webhook từ file
export function loadWebhookConfig() {
    try {
        console.log(`Đang tải cấu hình webhook từ ${webhookConfigPath}`);
        
        // Kiểm tra thư mục có tồn tại
        const dir = path.dirname(webhookConfigPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Đã tạo thư mục ${dir}`);
        }
        
        if (fs.existsSync(webhookConfigPath)) {
            console.log(`File cấu hình webhook tồn tại: ${webhookConfigPath}`);
            
            // Kiểm tra quyền đọc file
            try {
                const stats = fs.statSync(webhookConfigPath);
                console.log(`File cấu hình kích thước: ${stats.size} bytes`);
                
                if (stats.size === 0) {
                    console.warn("File cấu hình rỗng, sử dụng cấu hình mặc định");
                    saveWebhookConfig();
                    return;
                }
            } catch (statError) {
                console.error(`Lỗi khi kiểm tra thông tin file: ${statError.message}`);
            }
            
            try {
                const configData = fs.readFileSync(webhookConfigPath, 'utf8');
                webhookConfig = JSON.parse(configData);
                console.log("Đã tải cấu hình webhook thành công");
                
                // Đảm bảo cấu trúc dữ liệu đúng
                if (!webhookConfig.default) {
                    console.warn("Cấu hình không có phần default, thêm vào");
                    webhookConfig.default = defaultConfig.default;
                }
                
                if (!webhookConfig.accounts) {
                    console.warn("Cấu hình không có phần accounts, thêm vào");
                    webhookConfig.accounts = {};
                }
            } catch (readError) {
                console.error(`Lỗi khi đọc/phân tích file cấu hình: ${readError.message}`);
                // Nếu không đọc được file hoặc JSON không hợp lệ, sử dụng cấu hình mặc định
                webhookConfig = defaultConfig;
                // Lưu lại cấu hình mặc định
                saveWebhookConfig();
            }
        } else {
            console.log(`File cấu hình webhook không tồn tại, tạo mới: ${webhookConfigPath}`);
            // Nếu file không tồn tại, tạo mới với cấu hình mặc định
            webhookConfig = defaultConfig;
            saveWebhookConfig();
        }
    } catch (error) {
        console.error("Lỗi khi tải cấu hình webhook:", error);
        // Đảm bảo luôn có cấu hình mặc định
        webhookConfig = defaultConfig;
    }
}

// Hàm lưu cấu hình webhook vào file
export function saveWebhookConfig() {
    try {
        // Kiểm tra thư mục có tồn tại
        const dir = path.dirname(webhookConfigPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Đã tạo thư mục ${dir}`);
        }
        
        // Kiểm tra quyền ghi file
        try {
            // Thử ghi một file tạm để kiểm tra quyền ghi
            const testPath = path.join(dir, '.test_write_permission');
            fs.writeFileSync(testPath, 'test', { flag: 'w' });
            fs.unlinkSync(testPath); // Xóa file test
        } catch (writeError) {
            console.error(`Không có quyền ghi vào thư mục ${dir}:`, writeError);
            throw new Error(`Không có quyền ghi vào thư mục ${dir}: ${writeError.message}`);
        }
        
        // Ghi file cấu hình
        fs.writeFileSync(webhookConfigPath, JSON.stringify(webhookConfig, null, 2), 'utf8');
        console.log(`Đã lưu cấu hình webhook vào ${webhookConfigPath}`);
        return true;
    } catch (error) {
        console.error("Lỗi khi lưu cấu hình webhook:", error);
        // Thử ghi vào thư mục tạm nếu thư mục gốc bị lỗi
        try {
            const tempDir = os.tmpdir();
            const tempPath = path.join(tempDir, 'webhookConfig.json');
            fs.writeFileSync(tempPath, JSON.stringify(webhookConfig, null, 2), 'utf8');
            console.log(`Đã lưu cấu hình webhook vào thư mục tạm: ${tempPath}`);
            return false;
        } catch (tempError) {
            console.error("Không thể lưu cấu hình webhook vào thư mục tạm:", tempError);
            return false;
        }
    }
}

// Hàm lấy webhook URL theo ownId và loại
export function getWebhookUrl(key, ownId) {
    try {
        // Nếu có ownId và có cấu hình riêng cho ownId đó
        if (ownId && webhookConfig.accounts[ownId] && webhookConfig.accounts[ownId][key]) {
            return webhookConfig.accounts[ownId][key];
        }
        
        // Nếu không có cấu hình riêng, sử dụng cấu hình mặc định
        return webhookConfig.default[key] || "";
    } catch (error) {
        console.error("Lỗi khi lấy webhook URL:", error);
        return "";
    }
}

// Hàm thiết lập webhook URL cho một số điện thoại cụ thể
export function setWebhookUrl(ownId, key, url) {
    try {
        // Đảm bảo đã khởi tạo đối tượng cho ownId
        if (!webhookConfig.accounts[ownId]) {
            webhookConfig.accounts[ownId] = {};
        }
        
        // Thiết lập URL cho key tương ứng
        webhookConfig.accounts[ownId][key] = url;
        
        // Lưu cấu hình vào file
        saveWebhookConfig();
        return true;
    } catch (error) {
        console.error("Lỗi khi thiết lập webhook URL:", error);
        return false;
    }
}

// Hàm xóa cấu hình webhook cho một số điện thoại
export function removeWebhookConfig(ownId) {
    try {
        if (webhookConfig.accounts[ownId]) {
            delete webhookConfig.accounts[ownId];
            saveWebhookConfig();
        }
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa cấu hình webhook:", error);
        return false;
    }
}

// Hàm lấy toàn bộ cấu hình webhook
export function getAllWebhookConfigs() {
    return webhookConfig;
}

// Tải cấu hình khi module được import
loadWebhookConfig();

export default {
    getWebhookUrl,
    setWebhookUrl,
    removeWebhookConfig,
    loadWebhookConfig,
    saveWebhookConfig,
    getAllWebhookConfigs
}; 