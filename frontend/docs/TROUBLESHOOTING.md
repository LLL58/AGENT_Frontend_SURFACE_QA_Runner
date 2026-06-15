# 故障排查指南

## 常见问题及解决方案

### 1. 浏览器启动失败

**错误信息**:
```
Error: Browser not started. Call start() first.
```

**可能原因**:
- Playwright 浏览器未安装
- 浏览器版本不兼容
- 系统资源不足

**解决方案**:
```bash
# 重新安装 Playwright 浏览器
npx playwright install

# 检查浏览器是否安装成功
npx playwright install --dry-run
```

---

### 2. 页面加载超时

**错误信息**:
```
TimeoutError: page.goto: Timeout 30000ms exceeded
```

**可能原因**:
- 目标应用未启动
- 网络连接问题
- 页面加载时间过长

**解决方案**:
```bash
# 1. 检查目标应用是否正在运行
curl http://localhost:3000

# 2. 增加超时时间
# 编辑 .env 文件
SURFACE_PAGE_TIMEOUT=60000

# 3. 检查网络连接
ping localhost
```

---

### 3. 控件点击超时

**错误信息**:
```
TimeoutError: page.click: Timeout 10000ms exceeded
```

**可能原因**:
- 控件不存在
- 控件不可见
- 控件被遮挡
- 选择器不正确

**解决方案**:
```bash
# 1. 检查选择器是否正确
# 使用 --headed 模式查看页面
npm run surface:debug

# 2. 增加动作超时时间
# 编辑 .env 文件
SURFACE_ACTION_TIMEOUT=20000

# 3. 检查页面是否完全加载
# 增加等待时间
```

---

### 4. 白屏检测误报

**问题**:
- 正常页面被检测为白屏
- 白屏页面未被检测到

**可能原因**:
- 页面内容异步加载
- 白屏检测阈值不合适
- SPA 应用初始为空

**解决方案**:
```typescript
// 调整白屏检测阈值
// 编辑 src/core/page-health-checker.ts

// 增加等待时间
await page.waitForLoadState('networkidle');

// 调整阈值
const isWhiteScreen = bodyText < 10 && visibleElements < 3;
```

---

### 5. 网络请求错误误报

**问题**:
- 正常请求被标记为错误
- 第三方资源请求被标记为错误

**可能原因**:
- 忽略规则配置不正确
- 第三方资源未被忽略

**解决方案**:
```typescript
// 编辑配置，添加忽略规则
ignore: {
  networkUrlPatterns: [
    'analytics',
    'tracking',
    'telemetry',
    'google-analytics',
    'facebook',
  ],
  statusCodes: [304, 204],
}
```

---

### 6. 内存不足

**错误信息**:
```
JavaScript heap out of memory
```

**可能原因**:
- 扫描页面过多
- 截图过多
- DOM 快照过大

**解决方案**:
```bash
# 1. 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 2. 减少扫描数量
# 编辑 .env 文件
SURFACE_MAX_ROUTES=5
SURFACE_MAX_CONTROLS=10

# 3. 只保存失败的截图
```

---

### 7. 测试失败

**错误信息**:
```
Test Files  1 failed | 20 passed (21)
```

**可能原因**:
- 性能波动
- 环境差异
- 代码错误

**解决方案**:
```bash
# 1. 重新运行测试
npm test

# 2. 查看详细错误
npm test -- --reporter=verbose

# 3. 运行单个测试
npx vitest run tests/unit/specific.test.ts
```

---

### 8. 配置加载失败

**错误信息**:
```
Error: baseUrl is required
```

**可能原因**:
- .env 文件不存在
- 环境变量未设置
- 配置格式错误

**解决方案**:
```bash
# 1. 创建 .env 文件
cp .env.example .env

# 2. 编辑配置
# 确保 E2E_BASE_URL 已设置
E2E_BASE_URL=http://localhost:3000

# 3. 检查配置
npm run surface:health
```

---

### 9. 报告生成失败

**错误信息**:
```
Error: ENOENT: no such file or directory
```

**可能原因**:
- 输出目录不存在
- 权限问题
- 磁盘空间不足

**解决方案**:
```bash
# 1. 创建输出目录
mkdir -p .agent-feedback

# 2. 检查权限
chmod 755 .agent-feedback

# 3. 检查磁盘空间
df -h
```

---

### 10. 模块导入失败

**错误信息**:
```
Error: Cannot find module 'surface-qa-agent-runner'
```

**可能原因**:
- 包未安装
- 路径错误
- 版本不匹配

**解决方案**:
```bash
# 1. 安装包
npm install surface-qa-agent-runner

# 2. 或使用本地链接
cd frontend
npm link

# 在其他项目中
npm link surface-qa-agent-runner
```

---

## 调试技巧

### 1. 启用调试模式

```bash
# 有头浏览器模式
npm run surface:debug

# 或使用 --headed 参数
npm run surface:agent -- --headed
```

### 2. 查看详细日志

```bash
# 设置环境变量
export DEBUG=surface-qa:*

# 运行工具
npm run surface:agent
```

### 3. 使用 Playwright Inspector

```bash
# 启动 Playwright Inspector
PWDEBUG=1 npm run surface:agent
```

### 4. 查看 Trace

```bash
# 查看 trace 文件
npx playwright show-trace .agent-feedback/artifacts/trace.zip
```

---

## 获取帮助

如果以上方案都无法解决问题：

1. **查看 GitHub Issues**: https://github.com/LLL58/AGENT_Frontend_SURFACE_QA_Runner/issues
2. **提交新 Issue**: 包含错误信息、复现步骤、环境信息
3. **查看文档**: docs/ 目录下的其他文档
