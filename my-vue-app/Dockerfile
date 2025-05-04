# 构建阶段
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
# 新增：单独复制源码目录
COPY src/ ./src       
# 新增：单独复制静态资源  
COPY public/ ./public   
RUN npm install --registry=https://registry.npmmirror.com --retry=5
# 移动到依赖安装之后
COPY . .                
RUN npm run build

# 生产阶段
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
