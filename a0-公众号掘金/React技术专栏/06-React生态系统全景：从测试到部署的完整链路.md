# React生态系统全景：从测试到部署的完整链路

> 🌐 想象一下，你的React应用就像一个从"手工作坊"升级到"智能工厂"的过程！从单元测试的"质检员"，到CI/CD的"自动化生产线"，再到监控系统的"智能管家"，每一步都是让应用从"玩具"变成"企业级产品"的关键！今天我们要从"游击队"级别的开发，一路升级到"正规军"！

## 🎯 开篇小故事：从游击队到正规军的进化

还记得第一次部署React应用时的场景吗？手动打包、FTP上传、SSH连接、重启服务，每一步都像在打仗！就像游击队打仗，虽然灵活但效率低下！

今天，我们要从游击队级别的开发，一路升级到正规军级别的企业级开发！🚀

## 🧪 第一章：测试全家桶 - 质检员上岗

### Vitest单元测试

```javascript
// tests/setup.js - 测试环境配置
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// 全局配置
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && received.ownerDocument.contains(received);
    return {
      pass,
      message: () => `expected ${received} to be in the document`
    };
  }
});

// 清理测试环境
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// mocks/handlers.js - API模拟
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        products: [
          { id: 1, name: 'iPhone 14', price: 5999 },
          { id: 2, name: 'MacBook Pro', price: 12999 }
        ]
      })
    );
  }),
  
  rest.post('/api/cart/add', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: '商品已添加到购物车' })
    );
  })
];

export const server = setupServer(...handlers);
```

### 组件测试实战

```jsx
// tests/components/ProductCard.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../src/components/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: '测试商品',
    price: 99.99,
    image: 'test-image.jpg',
    description: '这是一个测试商品'
  };

  it('应该正确渲染商品信息', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('测试商品')).toBeInTheDocument();
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
    expect(screen.getByAltText('测试商品')).toHaveAttribute('src', 'test-image.jpg');
  });

  it('应该触发添加到购物车事件', () => {
    const handleAddToCart = vi.fn();
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={handleAddToCart} 
      />
    );
    
    const addButton = screen.getByText('加入购物车');
    fireEvent.click(addButton);
    
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('应该显示加载状态', () => {
    render(<ProductCard product={mockProduct} loading={true} />);
    
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });
});

// tests/hooks/useCart.test.js
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../../src/hooks/useCart';

describe('useCart', () => {
  it('应该添加商品到购物车', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addToCart({ id: 1, name: '商品1', price: 100 });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(100);
  });

  it('应该移除购物车商品', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addToCart({ id: 1, name: '商品1', price: 100 });
      result.current.removeFromCart(1);
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('应该更新商品数量', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addToCart({ id: 1, name: '商品1', price: 100 });
      result.current.updateQuantity(1, 3);
    });
    
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.total).toBe(300);
  });
});
```

### Cypress E2E测试

```javascript
// cypress/e2e/shopping-flow.cy.js
describe('购物全流程测试', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('应该完成完整的购物流程', () => {
    // 1. 浏览商品列表
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);
    
    // 2. 搜索商品
    cy.get('[data-testid="search-input"]').type('iPhone');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="product-card"]').should('contain', 'iPhone');
    
    // 3. 查看商品详情
    cy.get('[data-testid="product-card"]').first().click();
    cy.url().should('include', '/products/');
    cy.get('[data-testid="product-name"]').should('be.visible');
    
    // 4. 添加到购物车
    cy.get('[data-testid="add-to-cart-button"]').click();
    cy.get('[data-testid="cart-count"]').should('contain', '1');
    
    // 5. 查看购物车
    cy.get('[data-testid="cart-button"]').click();
    cy.url().should('include', '/cart');
    cy.get('[data-testid="cart-item"]').should('have.length', 1);
    
    // 6. 结算流程
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/checkout');
    
    // 7. 填写收货信息
    cy.get('[data-testid="name-input"]').type('张三');
    cy.get('[data-testid="address-input"]').type('北京市朝阳区');
    cy.get('[data-testid="phone-input"]').type('13800138000');
    
    // 8. 提交订单
    cy.get('[data-testid="submit-order-button"]').click();
    cy.url().should('include', '/order-success');
    cy.get('[data-testid="order-success-message"]').should('contain', '订单提交成功');
  });

  it('应该处理商品库存不足的情况', () => {
    cy.intercept('POST', '/api/cart/add', {
      statusCode: 400,
      body: { error: '库存不足' }
    });
    
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart-button"]').click();
    cy.get('[data-testid="error-message"]').should('contain', '库存不足');
  });
});
```

## 🐳 第二章：构建与部署 - 自动化生产线

### Docker多阶段构建

```dockerfile
# Dockerfile - 多阶段构建优化
# 阶段1：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 阶段2：生产环境
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# .dockerignore - 减少构建上下文
node_modules
npm-debug.log
.git
.gitignore
README.md
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Nginx高性能配置

```nginx
# nginx.conf - 生产级配置
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 缓存策略
    map $sent_http_content_type $expires {
        default                    1M;
        text/html                  epoch;
        text/css                   1M;
        application/javascript     1M;
        ~image/                    1M;
    }

    expires $expires;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # React Router支持
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API代理
        location /api/ {
            proxy_pass http://backend:3000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### CI/CD流水线配置

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 测试阶段
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run component tests
        run: npm run test:component
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # E2E测试
  e2e-test:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        uses: cypress-io/github-action@v5
        with:
          build: npm run build
          start: npm run preview
          wait-on: 'http://localhost:4173'

  # 构建和部署
  build-and-deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e-test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to production
        run: |
          # 这里可以添加部署脚本
          # 例如：kubectl apply -f k8s/
          echo "部署到生产环境"

  # 性能测试
  performance-test:
    runs-on: ubuntu-latest
    needs: build-and-deploy
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://your-app.com
          uploadArtifacts: true
          temporaryPublicStorage: true
```

## 📊 第三章：监控与日志 - 智能管家系统

### 前端监控方案

```javascript
// utils/monitoring.js - 前端监控工具
class FrontendMonitor {
  constructor(config) {
    this.config = config;
    this.init();
  }

  init() {
    this.setupErrorTracking();
    this.setupPerformanceMonitoring();
    this.setupUserBehaviorTracking();
  }

  // 错误监控
  setupErrorTracking() {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href
      });
    });

    // React错误边界
    this.ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true };
      }

      componentDidCatch(error, errorInfo) {
        FrontendMonitor.getInstance().reportError({
          type: 'react',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
          url: window.location.href
        });
      }

      render() {
        if (this.state.hasError) {
          return (
            <div className="error-fallback">
              <h2>出错了，请刷新页面</h2>
              <button onClick={() => window.location.reload()}>
                刷新页面
              </button>
            </div>
          );
        }

        return this.props.children;
      }
    };
  }

  // 性能监控
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // 核心Web指标
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.reportMetric('navigation', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              ttfb: entry.responseStart - entry.requestStart
            });
          }

          if (entry.entryType === 'paint') {
            this.reportMetric('paint', {
              name: entry.name,
              startTime: entry.startTime
            });
          }

          if (entry.entryType === 'largest-contentful-paint') {
            this.reportMetric('lcp', {
              value: entry.startTime
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  }

  // 用户行为追踪
  setupUserBehaviorTracking() {
    // 页面停留时间
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - startTime;
      this.reportMetric('page_duration', { duration, url: window.location.href });
    });

    // 点击事件
    document.addEventListener('click', (event) => {
      this.reportMetric('click', {
        element: event.target.tagName,
        className: event.target.className,
        id: event.target.id,
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      });
    });
  }

  // 报告错误
  reportError(errorData) {
    fetch('/api/monitor/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });
  }

  // 报告指标
  reportMetric(type, data) {
    fetch('/api/monitor/metric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: Date.now() })
    });
  }

  static getInstance() {
    if (!FrontendMonitor.instance) {
      FrontendMonitor.instance = new FrontendMonitor({
        apiEndpoint: '/api/monitor',
        environment: process.env.NODE_ENV
      });
    }
    return FrontendMonitor.instance;
  }
}

// 使用监控
const monitor = FrontendMonitor.getInstance();

// 错误边界包装应用
function App() {
  const ErrorBoundary = monitor.ErrorBoundary;
  
  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
```

### 后端监控服务

```javascript
// server/monitoring.js - 后端监控服务
const express = require('express');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

class MonitoringService {
  constructor() {
    this.logger = this.setupLogger();
    this.setupMetrics();
  }

  setupLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d'
        }),
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d'
        })
      ]
    });
  }

  setupMetrics() {
    // 应用性能指标
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTime: [],
      activeConnections: 0
    };

    // 中间件：记录请求指标
    this.requestMiddleware = (req, res, next) => {
      const startTime = Date.now();
      this.metrics.activeConnections++;

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.metrics.requestCount++;
        this.metrics.responseTime.push(duration);
        this.metrics.activeConnections--;

        if (res.statusCode >= 400) {
          this.metrics.errorCount++;
        }

        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });

      next();
    };

    // 错误处理中间件
    this.errorMiddleware = (error, req, res, next) => {
      this.logger.error('Application Error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      
      res.status(500).json({ error: 'Internal Server Error' });
    };
  }

  // 获取系统健康状态
  getHealthStatus() {
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics: {
        requestCount: this.metrics.requestCount,
        errorCount: this.metrics.errorCount,
        errorRate: this.metrics.requestCount > 0 ? (this.metrics.errorCount / this.metrics.requestCount) * 100 : 0,
        avgResponseTime: avgResponseTime,
        activeConnections: this.metrics.activeConnections
      }
    };
  }
}

module.exports = MonitoringService;
```

## 🔧 第四章：开发工具与调试 - 瑞士军刀套装

### VS Code配置优化

```json
// .vscode/settings.json - VS Code项目配置
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "plaintext": "html"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true,
    "**/coverage": true
  },
  "eslint.workingDirectories": ["./"],
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}

// .vscode/extensions.json - 推荐插件
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-react",
    "ms-vscode.vscode-cypress-snippets",
    "ms-vscode.vscode-testing"
  ]
}

// .vscode/launch.json - 调试配置
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 浏览器调试工具配置

```javascript
// src/utils/devtools.js - 开发工具配置
export function setupDevTools() {
  if (process.env.NODE_ENV === 'development') {
    // React DevTools配置
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = true;
    }

    // 控制台调试工具
    window.debug = {
      // 调试状态
      logState: (store) => {
        console.group('应用状态');
        console.log('Store:', store.getState());
        console.groupEnd();
      },

      // 调试性能
      measurePerformance: (fn, name) => {
        console.time(name);
        const result = fn();
        console.timeEnd(name);
        return result;
      },

      // 调试网络请求
      logRequests: () => {
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
          console.group('API Request');
          console.log('URL:', args[0]);
          console.log('Options:', args[1]);
          console.groupEnd();
          
          return originalFetch(...args).then(response => {
            console.group('API Response');
            console.log('Status:', response.status);
            console.log('URL:', response.url);
            console.groupEnd();
            return response;
          });
        };
      },

      // 调试内存使用
      logMemory: () => {
        if (performance.memory) {
          console.table({
            '已用内存': `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            '总内存': `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            '内存限制': `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
          });
        }
      }
    };
  }
}
```

## 📱 第五章：PWA与离线支持 - 离线工厂

### Service Worker配置

```javascript
// public/sw.js - Service Worker配置
const CACHE_NAME = 'react-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中，返回缓存
        if (response) {
          return response;
        }

        // 克隆请求
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // 检查是否收到有效的响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // 离线时返回离线页面
        return caches.match('/offline.html');
      })
  );
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartData());
  }
});

async function syncCartData() {
  const cartData = await getLocalCartData();
  if (cartData.length > 0) {
    try {
      await fetch('/api/cart/sync', {
        method: 'POST',
        body: JSON.stringify(cartData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // 同步成功后清除本地数据
      await clearLocalCartData();
    } catch (error) {
      console.error('同步购物车失败:', error);
    }
  }
}
```

### Manifest配置

```json
// public/manifest.json - PWA配置
{
  "name": "React电商应用",
  "short_name": "ReactShop",
  "description": "基于React的现代化电商应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["shopping", "business"],
  "lang": "zh-CN",
  "scope": "/",
  "screenshots": [
    {
      "src": "screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 离线支持实现

```javascript
// src/hooks/useOfflineSync.js - 离线同步Hook
import { useEffect, useState } from 'react';

function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToSyncQueue = (action) => {
    setSyncQueue(prev => [...prev, action]);
    localStorage.setItem('syncQueue', JSON.stringify([...syncQueue, action]));
  };

  const processSyncQueue = async () => {
    const storedQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    if (storedQueue.length === 0) return;

    for (const action of storedQueue) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(action),
          headers: { 'Content-Type': 'application/json' }
        });
        
        // 移除已处理的动作
        setSyncQueue(prev => prev.filter(item => item.id !== action.id));
      } catch (error) {
        console.error('同步失败:', error);
      }
    }

    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
  };

  return { isOnline, addToSyncQueue, syncQueue };
}

// 使用示例
function ShoppingCart() {
  const { isOnline, addToSyncQueue } = useOfflineSync();
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const action = {
      id: Date.now(),
      type: 'ADD_TO_CART',
      payload: product,
      timestamp: Date.now()
    };

    if (isOnline) {
      // 在线直接同步
      fetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify(product),
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // 离线加入同步队列
      addToSyncQueue(action);
    }

    setCart(prev => [...prev, product]);
  };

  return (
    <div>
      <div className={`status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 在线' : '🔴 离线'}
      </div>
      {/* 购物车内容 */}
    </div>
  );
}
```

## 🏗️ 第六章：实战项目模板 - 企业级脚手架

### 项目结构

```
react-enterprise-template/
├── src/
│   ├── components/          # 通用组件
│   │   ├── common/         # 基础组件
│   │   ├── layout/         # 布局组件
│   │   └── business/       # 业务组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # API服务
│   ├── stores/             # 状态管理
│   ├── utils/              # 工具函数
│   ├── styles/             # 样式文件
│   ├── tests/              # 测试文件
│   └── types/              # TypeScript类型
├── public/
│   ├── sw.js              # Service Worker
│   ├── manifest.json      # PWA配置
│   └── offline.html       # 离线页面
├── docker/                # Docker配置
├── k8s/                   # Kubernetes配置
├── .github/               # GitHub Actions
├── nginx/                 # Nginx配置
├── scripts/               # 构建脚本
└── docs/                  # 项目文档
```

### 项目初始化脚本

```bash
#!/bin/bash
# scripts/init-project.sh - 项目初始化脚本

echo "🚀 开始初始化React企业级项目..."

# 检查Node版本
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装Node.js"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js版本需要16或更高"
    exit 1
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 初始化Git Hooksecho "🔧 设置Git Hooks..."
npx husky install
npx husky add .husky/pre-commit "npm run lint-staged"
npx husky add .husky/pre-push "npm run test"

# 创建环境文件
echo "⚙️ 创建环境配置文件..."
cp .env.example .env.local
cp .env.example .env.development
cp .env.example .env.production

# 初始化Git仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    git add .
    git commit -m "Initial commit: React enterprise template"
fi

# 创建必要的目录
echo "📂 创建项目目录结构..."
mkdir -p src/{components/{common,layout,business},pages,hooks,services,stores,utils,styles,tests,types}
mkdir -p docker k8s nginx scripts docs

# 设置文件权限
chmod +x scripts/*.sh

echo "✅ 项目初始化完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env.local 文件配置环境变量"
echo "2. 运行 npm run dev 启动开发服务器"
echo "3. 访问 http://localhost:3000 查看应用"
```

### 快速启动脚本

```json
// package.json - 脚本配置
{
  "name": "react-enterprise-template",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "cypress open",
    "test:e2e:ci": "cypress run",
    "docker:build": "docker build -t react-app .",
    "docker:run": "docker run -p 80:80 react-app",
    "docker:dev": "docker-compose up",
    "deploy": "npm run build && npm run docker:build && npm run docker:run",
    "analyze": "npm run build && npx vite-bundle-analyzer dist"
  }
}
```

## 📋 最佳实践清单

### 开发阶段
- [ ] 使用ESLint和Prettier保持代码质量
- [ ] 配置Husky和lint-staged进行代码检查
- [ ] 使用TypeScript提供类型安全
- [ ] 编写单元测试和组件测试
- [ ] 使用Git分支策略（Git Flow或GitHub Flow）

### 测试阶段
- [ ] 单元测试覆盖率 > 80%
- [ ] 组件测试覆盖关键用户场景
- [ ] E2E测试覆盖核心业务流程
- [ ] 性能测试（Lighthouse评分 > 90）
- [ ] 跨浏览器测试

### 构建阶段
- [ ] 启用Tree Shaking和代码分割
- [ ] 配置环境变量管理
- [ ] 优化构建速度和产物大小
- [ ] 生成source map用于调试
- [ ] 配置CDN加速

### 部署阶段
- [ ] 使用Docker容器化部署
- [ ] 配置CI/CD自动化流水线
- [ ] 设置蓝绿部署或滚动更新
- [ ] 配置SSL证书和HTTPS
- [ ] 设置域名和DNS

### 监控阶段
- [ ] 配置错误监控和报警
- [ ] 设置性能监控
- [ ] 配置用户行为分析
- [ ] 设置日志收集和分析
- [ ] 定期备份和数据恢复测试

### 维护阶段
- [ ] 定期更新依赖包
- [ ] 监控安全漏洞
- [ ] 优化性能和用户体验
- [ ] 收集用户反馈
- [ ] 定期代码审查

## 🎭 总结：从游击队到正规军的蜕变

通过今天的学习，我们从手工作坊级别的开发，一路升级到企业级正规军！记住这些要点：

1. **测试先行**：没有测试的代码就像没有质检的产品
2. **自动化部署**：手动部署是效率的敌人
3. **监控为王**：没有监控的应用就像盲人开车
4. **用户体验**：PWA让Web应用像原生应用一样强大
5. **持续集成**：CI/CD是现代开发的标配

> 💡 小贴士：企业级开发就像经营企业，需要完整的体系和流程，而不是单打独斗！现在，你已经具备了成为React企业级开发大师的能力！

**专栏总结**：至此，我们的React技术专栏6篇深度文章已全部完成！从Hooks到组件系统，从状态管理到性能优化，从测试到部署，构建了完整的React企业级开发体系！

**技术路线图**：
- 基础篇：Hooks深度解析 → 组件系统剖析
- 进阶篇：状态管理方案 → 性能优化秘籍
- 实战篇：生态系统全景 → 企业级项目模板

现在，你可以自信地说："我不仅会用React，更会构建企业级React应用！" 🚀

**下一步建议**：
1. 基于项目模板开始你的第一个企业级项目
2. 加入开源社区，贡献代码
3. 持续学习新技术和最佳实践
4. 分享你的经验和心得

祝你开发愉快，代码无bug！🎉