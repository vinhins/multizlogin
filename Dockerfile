FROM cangphamdocker/zalo-server:latest

# Sao chép toàn bộ thư mục src vào thư mục gốc của container
COPY src/ /app/

# Tạo các thư mục dữ liệu cần thiết
RUN mkdir -p /app/data/cookies

# Đảm bảo quyền và làm sạch bộ nhớ cache
RUN npm cache clean --force

# Set work directory
WORKDIR /app

# Mở cổng và định nghĩa điểm vào (entrypoint)
EXPOSE 3000
CMD ["node", "server.js"]