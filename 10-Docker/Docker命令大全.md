
# Docker 命令大全

## 1. 镜像管理

### 1.1 拉取镜像
```bash
docker pull [镜像]:[标签]
```
示例：
```bash
docker pull nginx:latest
```

### 1.2 列出镜像
```bash
docker images
docker image ls
```

#### 显示所有镜像
```bash
docker images -a
```

#### 过滤镜像
```bash
docker images --filter "dangling=true"
```

#### 格式化输出
```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 1.3 删除镜像
```bash
docker rmi [镜像ID]
```

#### 强制删除
```bash
docker rmi -f [镜像ID]
```

#### 删除悬空镜像
```bash
docker image prune
```

#### 删除所有未使用镜像
```bash
docker image prune -a
```

### 1.4 构建镜像
```bash
docker build -t [名称]:[标签] .
```

#### 指定Dockerfile
```bash
docker build -f Dockerfile.prod -t myapp:prod .
```

#### 构建参数
```bash
docker build --build-arg NODE_ENV=production -t myapp .
```

#### 多阶段构建
```bash
docker build --target production -t myapp:prod .
```

#### 不使用缓存
```bash
docker build --no-cache -t myapp .
```

### 1.5 导出镜像
```bash
docker save -o [文件].tar [镜像]
```
示例：
```bash
docker save -o nginx.tar nginx:latest
```

### 1.6 导入镜像
```bash
docker load -i [文件].tar
```
示例：
```bash
docker load -i nginx.tar
```

### 1.7 镜像历史
```bash
docker history [镜像]
```

### 1.8 镜像详情
```bash
docker inspect [镜像]
```

### 1.9 搜索镜像
```bash
docker search [关键词]
```
示例：
```bash
docker search --limit 5 nginx
```

### 1.10 标记镜像
```bash
docker tag [源镜像] [目标镜像]:[标签]
```
示例：
```bash
docker tag nginx:latest myregistry.com/nginx:v1.0
```

## 2. 容器操作

### 2.1 启动容器
```bash
docker run [选项] [镜像]
```

#### 常用选项
- 后台运行：`-d`
- 交互终端：`-it`
- 端口映射：`-p [主机端口]:[容器端口]`
- 挂载卷：`-v [主机路径]:[容器路径]`
- 自动删除：`--rm`
- 环境变量：`-e KEY=VALUE`
- 工作目录：`-w /app`
- 用户身份：`-u 1000:1000`
- 主机名：`--hostname myhost`
- 内存限制：`--memory 512m`
- CPU限制：`--cpus 0.5`
- 重启策略：`--restart unless-stopped`

示例：
```bash
docker run -d --name nginx-server -p 80:80 -v /data:/usr/share/nginx/html nginx
```

### 2.2 容器列表
```bash
docker ps -a
```

#### 运行中容器
```bash
docker ps
```

#### 最近创建
```bash
docker ps -l
```

#### 静默模式
```bash
docker ps -q
```

#### 格式化输出
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2.3 启停控制

#### 停止容器
```bash
docker stop [容器ID]
```

#### 强制停止
```bash
docker kill [容器ID]
```

#### 启动容器
```bash
docker start [容器ID]
```

#### 重启容器
```bash
docker restart [容器ID]
```

#### 暂停/恢复容器
```bash
docker pause [容器ID]
docker unpause [容器ID]
```

### 2.4 进入容器
```bash
docker exec -it [容器ID] /bin/bash
```

#### 执行命令
```bash
docker exec [容器ID] ls -la
```

#### 以root进入
```bash
docker exec -it -u root [容器ID] /bin/bash
```

#### 附加到容器
```bash
docker attach [容器ID]
```

### 2.5 删除容器
```bash
docker rm [容器ID]
```

#### 强制删除
```bash
docker rm -f [容器ID]
```

#### 删除所有停止容器
```bash
docker container prune
```

#### 删除所有容器
```bash
docker rm -f $(docker ps -aq)
```

### 2.6 查看日志
```bash
docker logs -f [容器ID]
```

#### 显示时间戳
```bash
docker logs -t [容器ID]
```

#### 最近N行
```bash
docker logs --tail 100 [容器ID]
```

#### 指定时间
```bash
docker logs --since "2023-01-01" [容器ID]
```

### 2.7 资源监控
```bash
docker stats
```

#### 指定容器
```bash
docker stats [容器ID]
```

### 2.8 容器详情
```bash
docker inspect [容器ID]
```

### 2.9 文件操作

#### 复制到容器
```bash
docker cp [本地路径] [容器ID]:[容器路径]
```

#### 从容器复制
```bash
docker cp [容器ID]:[容器路径] [本地路径]
```

示例：
```bash
docker cp ./app.js mycontainer:/app/
```

### 2.10 容器提交
```bash
docker commit [容器ID] [新镜像名]:[标签]
```
示例：
```bash
docker commit mycontainer myapp:v1.0
```

### 2.11 容器导出
```bash
docker export [容器ID] > container.tar
```

### 2.12 容器导入
```bash
docker import container.tar myimage:latest
```

### 2.13 端口查看
```bash
docker port [容器ID]
```

## 3. 网络管理

### 3.1 列出网络
```bash
docker network ls
```

### 3.2 创建网络
```bash
docker network create [网络名]
```

#### 指定驱动
```bash
docker network create --driver bridge mynetwork
```

#### 指定子网
```bash
docker network create --subnet=172.20.0.0/16 mynetwork
```

#### 指定网关
```bash
docker network create --gateway=172.20.0.1 mynetwork
```

#### 自定义网络
```bash
docker network create --driver bridge --subnet=192.168.1.0/24 --gateway=192.168.1.1 custom-net
```

### 3.3 网络详情
```bash
docker network inspect [网络名]
```

### 3.4 连接网络
```bash
docker network connect [网络名] [容器ID]
```

#### 指定IP
```bash
docker network connect --ip 172.20.0.10 mynetwork mycontainer
```

### 3.5 断开网络
```bash
docker network disconnect [网络名] [容器ID]
```

### 3.6 删除网络
```bash
docker network rm [网络名]
```

### 3.7 清理网络
```bash
docker network prune
```

### 3.8 网络类型
- **bridge（默认）**：桥接网络，容器间可通信
- **host**：使用主机网络栈
- **none**：无网络
- **overlay**：跨主机网络（Swarm模式）

## 4. 数据卷管理

### 4.1 创建卷
```bash
docker volume create [卷名]
```

#### 指定驱动
```bash
docker volume create --driver local myvolume
```

#### 带选项
```bash
docker volume create --opt type=nfs --opt device=:/path myvolume
```

### 4.2 列出卷
```bash
docker volume ls
```

#### 过滤悬空卷
```bash
docker volume ls --filter "dangling=true"
```

#### 格式化输出
```bash
docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
```

### 4.3 卷详情
```bash
docker volume inspect [卷名]
```

### 4.4 删除卷
```bash
docker volume rm [卷名]
```

### 4.5 清理卷
```bash
docker volume prune
```

### 4.6 挂载方式

#### 命名卷
```bash
docker run -v [卷名]:[容器路径] [镜像]
```

#### 绑定挂载
```bash
docker run -v [主机路径]:[容器路径] [镜像]
```

#### 只读挂载
```bash
docker run -v [路径]:[容器路径]:ro [镜像]
```

#### tmpfs挂载
```bash
docker run --tmpfs [容器路径] [镜像]
```

### 4.7 示例

#### 数据库卷
```bash
docker run -d -v mysql_data:/var/lib/mysql mysql:8.0
```

#### 配置文件
```bash
docker run -v /host/config:/app/config:ro nginx
```

#### 临时存储
```bash
docker run --tmpfs /tmp nginx
```

## 5. 系统维护

### 5.1 清理资源
```bash
docker system prune
```

#### 清理所有
```bash
docker system prune -a
```

#### 强制清理
```bash
docker system prune -f
```

#### 清理卷
```bash
docker system prune --volumes
```

### 5.2 系统信息
```bash
docker info
```

### 5.3 版本信息
```bash
docker version
```

### 5.4 磁盘使用
```bash
docker system df
```

#### 详细信息
```bash
docker system df -v
```

### 5.5 系统事件
```bash
docker system events
```

#### 过滤事件
```bash
docker system events --filter container=mycontainer
```

#### 指定时间
```bash
docker system events --since "2023-01-01"
```

### 5.6 资源监控

#### 内存使用
```bash
docker stats --format "table {{.Container}}\t{{.MemUsage}}"
```

#### CPU使用
```bash
docker stats --format "table {{.Container}}\t{{.CPUPerc}}"
```

### 5.7 清理命令

#### 清理容器
```bash
docker container prune
```

#### 清理镜像
```bash
docker image prune
```

#### 清理网络
```bash
docker network prune
```

#### 清理卷
```bash
docker volume prune
```

## 6. Docker Compose 完整指南

### 6.1 基础命令
├── 启动服务 → `docker-compose up -d`
│   ├── 前台运行 → `docker-compose up`
│   ├── 重新构建 → `docker-compose up --build`
│   ├── 强制重建 → `docker-compose up --force-recreate`
│   ├── 指定服务 → `docker-compose up -d nginx mysql`
│   └── 扩展服务 → `docker-compose up --scale web=3`
├── 停止服务 → `docker-compose down`
│   ├── 删除卷 → `docker-compose down -v`
│   ├── 删除镜像 → `docker-compose down --rmi all`
│   └── 删除孤儿容器 → `docker-compose down --remove-orphans`
├── 查看日志 → `docker-compose logs -f`
│   ├── 指定服务 → `docker-compose logs -f web`
│   ├── 最近N行 → `docker-compose logs --tail 100`
│   └── 显示时间戳 → `docker-compose logs -t`
├── 服务管理
│   ├── 启动服务 → `docker-compose start [服务名]`
│   ├── 停止服务 → `docker-compose stop [服务名]`
│   ├── 重启服务 → `docker-compose restart [服务名]`
│   └── 暂停服务 → `docker-compose pause [服务名]`
├── 查看状态 → `docker-compose ps`
│   ├── 所有服务 → `docker-compose ps -a`
│   └── 服务状态 → `docker-compose top`
├── 执行命令 → `docker-compose exec [服务名] [命令]`
│   ├── 进入容器 → `docker-compose exec web /bin/bash`
│   ├── 运行命令 → `docker-compose run --rm web npm install`
│   └── 一次性容器 → `docker-compose run --rm --no-deps web python manage.py migrate`
├── 配置管理
│   ├── 验证配置 → `docker-compose config`
│   ├── 查看配置 → `docker-compose config --services`
│   └── 解析配置 → `docker-compose config --resolve-image-digests`
└── 构建管理
    ├── 构建镜像 → `docker-compose build`
    ├── 无缓存构建 → `docker-compose build --no-cache`
    ├── 并行构建 → `docker-compose build --parallel`
    └── 指定服务构建 → `docker-compose build web`

### 6.2 Docker Compose V2 新功能
├── 新CLI命令 → `docker compose` (无连字符)
├── 配置文件
│   ├── 多文件支持 → `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`
│   ├── 环境文件 → `docker compose --env-file .env.prod up`
│   └── 项目名称 → `docker compose -p myproject up`
├── 服务配置增强
│   ├── 配置文件 → `configs` 顶级键
│   ├── 密钥管理 → `secrets` 顶级键
│   ├── 扩展字段 → `x-*` 自定义字段
│   └── 配置继承 → `extends` 服务继承
├── 网络增强
│   ├── 外部网络 → `external: true`
│   ├── 网络别名 → `aliases` 配置
│   └── 网络模式 → `network_mode: "host"`
├── 卷管理增强
│   ├── 外部卷 → `external: true`
│   ├── 卷驱动 → `driver_opts` 配置
│   └── 卷标签 → `labels` 配置
└── 部署配置
    ├── 资源限制 → `deploy.resources`
    ├── 副本数量 → `deploy.replicas`
    ├── 更新策略 → `deploy.update_config`
    └── 重启策略 → `deploy.restart_policy`

### 6.3 完整 docker-compose.yml 示例
```yaml
version: '3.8'

# 自定义扩展
x-common-variables: &common-variables
  POSTGRES_DB: myapp
  POSTGRES_USER: myuser

services:
  # Web应用
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    ports:
      - "3000:3000"
    environment:
      <<: *common-variables
      NODE_ENV: production
    volumes:
      - ./app:/app
      - node_modules:/app/node_modules
    networks:
      - frontend
      - backend
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 数据库
  db:
    image: postgres:13
    environment:
      <<: *common-variables
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    secrets:
      - db_password
    restart: unless-stopped

  # 缓存
  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend
    restart: unless-stopped

  # 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - frontend
    depends_on:
      - web
    restart: unless-stopped

# 网络配置
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

# 卷配置
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  node_modules:
    driver: local

# 密钥配置
secrets:
  db_password:
    file: ./secrets/db_password.txt

# 配置文件
configs:
  nginx_config:
    file: ./nginx.conf
```

### 6.4 环境配置文件 (.env)
```bash
# 应用配置
APP_ENV=production
APP_PORT=3000
APP_SECRET=your-secret-key

# 数据库配置
DB_HOST=db
DB_PORT=5432
DB_NAME=myapp
DB_USER=myuser
DB_PASSWORD=mypassword

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379

# 版本标签
APP_VERSION=1.0.0
NODE_VERSION=16-alpine
```

## 7. 高级功能与最佳实践

### 7.1 多阶段构建
```dockerfile
# 构建阶段
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 生产阶段
FROM node:16-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 7.2 健康检查
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### 7.3 安全最佳实践
├── 非root用户 → `USER 1001:1001`
├── 只读文件系统 → `docker run --read-only`
├── 删除不必要包 → `RUN apt-get purge -y --auto-remove`
├── 使用.dockerignore → 排除敏感文件
└── 扫描漏洞 → `docker scan [镜像名]`

### 7.4 性能优化
├── 镜像层优化 → 合并RUN命令
├── 缓存利用 → 合理安排COPY顺序
├── 基础镜像选择 → 使用alpine版本
├── 资源限制 → `--memory 512m --cpus 0.5`
└── 并行构建 → `docker build --parallel`

## 8. 经典应用场景

### 8.1 数据库部署
```bash
# MySQL
docker run -d --name mysql \
  -v mysql_data:/var/lib/mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=myapp \
  --restart unless-stopped \
  mysql:8.0

# PostgreSQL
docker run -d --name postgres \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypass \
  postgres:13

# Redis
docker run -d --name redis \
  -v redis_data:/data \
  -p 6379:6379 \
  redis:6-alpine redis-server --appendonly yes
```

### 8.2 Web应用部署
```bash
# Nginx
docker run -d --name nginx \
  -p 80:80 -p 443:443 \
  -v /host/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /host/ssl:/etc/nginx/ssl:ro \
  -v /host/html:/usr/share/nginx/html:ro \
  nginx:alpine

# Node.js应用
docker run -d --name nodeapp \
  -p 3000:3000 \
  -v /host/app:/app \
  -w /app \
  -e NODE_ENV=production \
  node:16-alpine npm start
```

### 8.3 开发环境
```bash
# 开发容器
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  -p 3000:3000 \
  node:16-alpine /bin/sh

# 数据库临时实例
docker run --rm \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:13
```

### 8.4 数据备份与恢复
```bash
# 备份数据卷
docker run --rm \
  -v mysql_data:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mysql-backup-$(date +%Y%m%d).tar.gz /source

# 恢复数据卷
docker run --rm \
  -v mysql_data:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mysql-backup.tar.gz -C /target --strip-components=1

# 数据库备份
docker exec mysql mysqldump -u root -p123456 myapp > backup.sql

# 数据库恢复
docker exec -i mysql mysql -u root -p123456 myapp < backup.sql
```

### 8.5 监控与日志
```bash
# 实时监控
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# 日志收集
docker run -d \
  -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name logspout \
  gliderlabs/logspout

# 系统监控
docker run -d \
  --name cadvisor \
  -p 8080:8080 \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:ro \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor:latest
```

## 9. 故障排查

### 9.1 常用调试命令
```bash
# 查看容器进程
docker exec [容器ID] ps aux

# 查看容器网络
docker exec [容器ID] netstat -tlnp

# 查看容器文件系统
docker exec [容器ID] df -h

# 查看容器环境变量
docker exec [容器ID] env

# 容器资源使用
docker exec [容器ID] top
```

### 9.2 日志分析
```bash
# 错误日志过滤
docker logs [容器ID] 2>&1 | grep -i error

# 实时日志监控
docker logs -f --since "1h" [容器ID]

# 日志大小限制
docker run --log-opt max-size=10m --log-opt max-file=3 [镜像]
```

### 9.3 性能分析
```bash
# 容器资源限制测试
docker run --memory=100m --cpus=0.5 stress --vm 1 --vm-bytes 150M

# 网络性能测试
docker run --rm -it networkstatic/iperf3 -c [目标IP]

# 磁盘IO测试
docker run --rm -v /tmp:/tmp ubuntu dd if=/dev/zero of=/tmp/test bs=1M count=100
```

## 10. Docker Swarm 集群管理

### 10.1 集群初始化
```bash
# 初始化Swarm
docker swarm init --advertise-addr [管理节点IP]

# 加入工作节点
docker swarm join --token [TOKEN] [管理节点IP]:2377

# 查看节点
docker node ls
```

### 10.2 服务管理
```bash
# 创建服务
docker service create --name web --replicas 3 -p 80:80 nginx

# 扩展服务
docker service scale web=5

# 更新服务
docker service update --image nginx:alpine web

# 查看服务
docker service ls
docker service ps web
```

### 10.3 栈部署
```bash
# 部署栈
docker stack deploy -c docker-compose.yml mystack

# 查看栈
docker stack ls
docker stack services mystack

# 删除栈
docker stack rm mystack
```