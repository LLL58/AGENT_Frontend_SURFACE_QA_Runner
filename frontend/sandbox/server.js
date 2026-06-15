/**
 * Surface QA 沙盒测试服务器
 * 
 * 功能：
 * - 提供静态文件服务
 * - 支持路由
 * - 支持 API 模拟（11个端点）
 * - 支持错误模拟
 * - 支持超时模拟
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
const STATIC_DIR = path.join(__dirname, 'public');

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
  '/white-screen': 'white-screen.html',
  '/slow': 'slow-page.html',
  '/form': 'form-validation.html',
  '/admin': 'admin.html',
};

// 模拟数据
const MOCK_DATA = {
  users: [
    { id: 1, name: '张三', email: 'zhangsan@example.com', phone: '13800138001', role: 'admin' },
    { id: 2, name: '李四', email: 'lisi@example.com', phone: '13800138002', role: 'user' },
    { id: 3, name: '王五', email: 'wangwu@example.com', phone: '13800138003', role: 'user' },
  ],
};

// API 路由配置
const API_ROUTES = {
  // 用户相关
  'GET /api/users': {
    status: 200,
    data: () => MOCK_DATA.users,
  },
  'GET /api/users/1': {
    status: 200,
    data: () => MOCK_DATA.users[0],
  },
  'GET /api/users/2': {
    status: 200,
    data: () => MOCK_DATA.users[1],
  },
  'GET /api/users/3': {
    status: 200,
    data: () => MOCK_DATA.users[2],
  },
  'PUT /api/users/1': {
    status: 200,
    data: () => ({ success: true, message: '更新成功' }),
  },
  
  // 认证相关
  'POST /api/login': {
    status: 200,
    data: () => ({ success: true, message: '登录成功', token: 'fake-jwt-token-12345' }),
  },
  
  // 错误模拟
  'GET /api/error': {
    status: 500,
    data: () => ({ error: 'Internal Server Error', message: '服务器内部错误', timestamp: new Date().toISOString() }),
  },
  'GET /api/not-found': {
    status: 404,
    data: () => ({ error: 'Not Found', message: '资源未找到', path: '/api/not-found' }),
  },
  'GET /api/unauthorized': {
    status: 401,
    data: () => ({ error: 'Unauthorized', message: '未授权访问' }),
  },
  'GET /api/forbidden': {
    status: 403,
    data: () => ({ error: 'Forbidden', message: '禁止访问' }),
  },
  'POST /api/validate': {
    status: 422,
    data: () => ({
      error: 'Validation Error',
      message: '验证失败',
      details: [
        { field: 'email', message: '邮箱格式不正确' },
        { field: 'name', message: '姓名不能为空' },
      ],
    }),
  },
};

/**
 * 创建 HTTP 服务器
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // 处理 API 请求
  if (pathname.startsWith('/api/')) {
    await handleApiRequest(req, res, method, pathname);
    return;
  }

  // 处理静态文件请求
  await handleStaticRequest(req, res, pathname);
});

/**
 * 处理 API 请求
 */
async function handleApiRequest(req, res, method, pathname) {
  // 处理动态路由（/api/users/:id）
  let routeKey = `${method} ${pathname}`;
  let apiRoute = API_ROUTES[routeKey];

  // 如果没有找到精确匹配，尝试动态匹配
  if (!apiRoute && pathname.match(/^\/api\/users\/\d+$/)) {
    const id = parseInt(pathname.split('/').pop());
    if (id >= 1 && id <= 3) {
      routeKey = `GET /api/users/${id}`;
      apiRoute = API_ROUTES[routeKey];
    }
  }

  // 处理慢响应
  if (pathname === '/api/slow') {
    console.log('慢响应请求，延迟 3 秒...');
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: '延迟响应',
        delay: 3000,
        timestamp: new Date().toISOString(),
      }));
    }, 3000);
    return;
  }

  // 处理超时（无响应）
  if (pathname === '/api/timeout') {
    console.log('超时请求，不返回响应...');
    // 故意不返回响应，模拟超时
    return;
  }

  if (apiRoute) {
    // 模拟网络延迟（50-200ms）
    const delay = Math.floor(Math.random() * 150) + 50;
    
    setTimeout(() => {
      const responseData = typeof apiRoute.data === 'function' ? apiRoute.data() : apiRoute.data;
      res.writeHead(apiRoute.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseData));
    }, delay);
  } else {
    // 默认返回 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `API 端点不存在: ${method} ${pathname}`,
      timestamp: new Date().toISOString(),
    }));
  }
}

/**
 * 处理静态文件请求
 */
async function handleStaticRequest(req, res, pathname) {
  // 查找路由映射
  let filename = ROUTES[pathname];
  
  // 如果没有路由映射，使用原始路径
  if (!filename) {
    filename = pathname;
  }

  // 构建文件路径
  const filePath = path.join(STATIC_DIR, filename);

  // 检查文件是否存在
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch (err) {
    // 文件不存在，返回 404
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>404 - 页面未找到</h1><p>请求的页面不存在</p></body></html>');
    return;
  }

  // 获取文件扩展名
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 读取文件
  try {
    const data = await fs.promises.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    // 读取失败，返回 500
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>500 - 服务器内部错误</h1><p>无法读取文件</p></body></html>');
  }
}

/**
 * 启动服务器
 */
server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Surface QA 沙盒测试服务器已启动                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  服务器地址: http://localhost:${PORT}                         ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('可用页面:');
  console.log(`  主页:         http://localhost:${PORT}/`);
  console.log(`  登录:         http://localhost:${PORT}/login`);
  console.log(`  仪表盘:       http://localhost:${PORT}/dashboard`);
  console.log(`  个人资料:     http://localhost:${PORT}/profile`);
  console.log(`  错误页面:     http://localhost:${PORT}/error`);
  console.log(`  白屏页面:     http://localhost:${PORT}/white-screen`);
  console.log(`  慢响应页面:   http://localhost:${PORT}/slow`);
  console.log(`  表单验证:     http://localhost:${PORT}/form`);
  console.log(`  权限页面:     http://localhost:${PORT}/admin`);
  console.log('');
  console.log('API 端点:');
  console.log('  GET  /api/users         - 获取用户列表');
  console.log('  GET  /api/users/:id     - 获取用户详情');
  console.log('  PUT  /api/users/:id     - 更新用户信息');
  console.log('  POST /api/login         - 用户登录');
  console.log('  GET  /api/error         - 服务器错误 (500)');
  console.log('  GET  /api/not-found     - 资源未找到 (404)');
  console.log('  GET  /api/unauthorized  - 未授权 (401)');
  console.log('  GET  /api/forbidden     - 禁止访问 (403)');
  console.log('  POST /api/validate      - 验证失败 (422)');
  console.log('  GET  /api/slow          - 慢响应 (3秒延迟)');
  console.log('  GET  /api/timeout       - 超时 (无响应)');
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
