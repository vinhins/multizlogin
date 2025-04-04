import fs from 'fs';
import path from 'path';

// Danh sách thư mục cần tạo nếu chưa tồn tại
const directories = [
  'src/config',
  'src/middleware',
  'src/models',
  'src/public/css',
  'src/public/js',
  'src/public/images',
  'src/routes',
  'src/services',
  'src/utils',
  'data/cookies',
  'data/zalo_data',
  'scripts',
  'docker',
  'tests'
];

// Tạo thư mục nếu chưa tồn tại
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Đã tạo thư mục: ${dir}`);
  }
});

// Di chuyển các file
const filesToMove = [
  { src: '.env', dest: 'src/config/.env' },
  { src: '.env.example', dest: 'src/config/.env.example' },
  { src: 'webhookConfig.json', dest: 'src/config/webhookConfig.json' },
  { src: 'proxies.json', dest: 'data/proxies.json' },
  { src: 'helpers.js', dest: 'src/utils/helpers.js' },
  { src: 'auth.js', dest: 'src/services/authService.js' },
  { src: 'proxyService.js', dest: 'src/services/proxyService.js' },
  { src: 'webhookConfig.js', dest: 'src/services/webhookService.js' },
  { src: 'routes-api.js', dest: 'src/routes/api.js' },
  { src: 'routes-ui.js', dest: 'src/routes/ui.js' },
  { src: 'routes.js', dest: 'src/routes/index.js' },
  { src: 'server.js', dest: 'src/server.js' },
  { src: 'eventListeners.js', dest: 'src/eventListeners.js' },
  { src: 'Dockerfile', dest: 'docker/Dockerfile' },
  { src: 'docker-compose.yaml', dest: 'docker/docker-compose.yaml' },
  { src: 'docker-compose.new.yaml', dest: 'docker/docker-compose.new.yaml' },
  { src: 'update-zalo-server.sh', dest: 'scripts/update-zalo-server.sh' },
  { src: 'prepare-docker.sh', dest: 'scripts/prepare-docker.sh' },
  { src: 'migrate-to-zalo-data.sh', dest: 'scripts/migrate-to-zalo-data.sh' }
];

// Di chuyển file (copy & xác nhận trước khi xóa)
filesToMove.forEach(file => {
  try {
    if (fs.existsSync(file.src)) {
      // Copy file
      fs.copyFileSync(file.src, file.dest);
      console.log(`✅ Đã copy: ${file.src} -> ${file.dest}`);
    } else {
      console.log(`⚠️ Không tìm thấy file: ${file.src}`);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi di chuyển file ${file.src}:`, error.message);
  }
});

// Di chuyển các file HTML sang dạng EJS
try {
  const htmlFiles = fs.readdirSync('.')
    .filter(file => file.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    const baseName = file.replace('.html', '');
    try {
      fs.copyFileSync(file, `src/views/${baseName}.ejs`);
      console.log(`✅ Đã copy: ${file} -> src/views/${baseName}.ejs`);
    } catch (error) {
      console.error(`❌ Lỗi khi di chuyển file ${file}:`, error.message);
    }
  });
} catch (error) {
  console.error('❌ Lỗi khi tìm các file HTML:', error.message);
}

// Di chuyển nội dung thư mục cookies nếu tồn tại
if (fs.existsSync('cookies')) {
  try {
    const cookieFiles = fs.readdirSync('cookies');
    cookieFiles.forEach(file => {
      try {
        fs.copyFileSync(`cookies/${file}`, `data/cookies/${file}`);
        console.log(`✅ Đã copy: cookies/${file} -> data/cookies/${file}`);
      } catch (error) {
        console.error(`❌ Lỗi khi di chuyển file cookies/${file}:`, error.message);
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi tìm các file cookie:', error.message);
  }
}

// Di chuyển nội dung thư mục zalo_data nếu tồn tại
if (fs.existsSync('zalo_data')) {
  try {
    const zaloDataFiles = fs.readdirSync('zalo_data');
    zaloDataFiles.forEach(file => {
      try {
        fs.copyFileSync(`zalo_data/${file}`, `data/zalo_data/${file}`);
        console.log(`✅ Đã copy: zalo_data/${file} -> data/zalo_data/${file}`);
      } catch (error) {
        console.error(`❌ Lỗi khi di chuyển file zalo_data/${file}:`, error.message);
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi tìm các file zalo_data:', error.message);
  }
}

console.log('\n✅ Hoàn thành việc di chuyển cấu trúc thư mục!');
console.log('\nLưu ý quan trọng:');
console.log('1. Kiểm tra xem tất cả file đã được di chuyển thành công chưa');
console.log('2. Cập nhật các đường dẫn import trong mã nguồn để phản ánh cấu trúc thư mục mới');
console.log('3. Chạy lệnh "npm start" để kiểm tra ứng dụng hoạt động với cấu trúc mới');
console.log('4. Chỉ xóa các file gốc sau khi đã xác nhận mọi thứ hoạt động tốt'); 