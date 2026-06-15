/**
 * Surface QA 测试应用 - 本地服务器
 * 
 * 功能：
 * - 提供静态文件服务
 * - 支持路由
 * - 支持 API 模拟
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const PORT = process.env.PORT || 3010;
const STATIC_DIR = __dirname;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// 路由映射
const ROUTES = {
  '/': 'index.html',
  '/login': 'login.html',
  '/dashboard': 'dashboard.html',
  '/profile': 'profile.html',
  '/error': 'error-page.html',
};

// API 模拟
const API_ROUTES = {
  'GET /api/users': {
    status: 200,
    data: [
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '李四', email: 'lisi@example.com' },
      { id: 3, name: '王五', email: 'wangwu@example.com' },
    ]
  },
  'POST /api/login': {
    status: 200,
    data: { success: true, message: '登录成功', token: 'fake-jwt-token' }
  },
  'GET /api/error': {
    status: 500,
    data: { error: '服务器内部错误' }
  },
  'GET /api/not-found': {
    status: 404,
    data: { error: '资源未找到' }
  },
};

/**
 * 创建 HTTP 服务器
 */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // 处理 API 请求
  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, method, pathname);
    return;
  }

  // 处理静态文件请求
  handleStaticRequest(req, res, pathname);
});

/**
 * 处理 API 请求
 */
function handleApiRequest(req, res, method, pathname) {
  const routeKey = `${method} ${pathname}`;
  const apiRoute = API_ROUTES[routeKey];

  if (apiRoute) {
    // 模拟网络延迟
    setTimeout(() => {
      res.writeHead(apiRoute.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(apiRoute.data));
    }, 100);
  } else {
    // 默认返回 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API 端点不存在' }));
  }
}

/**
 * 处理静态文件请求
 */
function handleStaticRequest(req, res, pathname) {
  // 查找路由映射
  let filename = ROUTES[pathname];
  
  // 如果没有路由映射，使用原始路径
  if (!filename) {
    filename = pathname;
  }

  // 构建文件路径
  const filePath = path.join(STATIC_DIR, filename);

  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 文件不存在，返回 404
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>404 - 页面未找到</h1></body></html>');
      return;
    }

    // 获取文件扩展名
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // 读取失败，返回 500
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>500 - 服务器内部错误</h1></body></html>');
        return;
      }

      // 返回文件内容
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

/**
 * 启动服务器
 */
server.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
  console.log('');
  console.log('可用页面:');
  console.log(`  主页: http://localhost:${PORT}/`);
  console.log(`  登录: http://localhost:${PORT}/login`);
  console.log(`  仪表盘: http://localhost:${PORT}/dashboard`);
  console.log(`  个人资料: http://localhost:${PORT}/profile`);
  console.log(`  错误页面: http://localhost:${PORT}/error`);
  console.log('');
  console.log('API 端点:');
  console.log(`  GET /api/users - 获取用户列表`);
  console.log(`  POST /api/login - 用户登录`);
  console.log(`  GET /api/error - 触发 500 错误`);
  console.log(`  GET /api/not-found - 触发 404 错误`);
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
});

/**
 * 优雅关闭服务器
 */
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
