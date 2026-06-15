# 贡献指南

感谢您对 Surface QA Agent Runner 项目的关注！本文档将帮助您了解如何参与项目开发。

## 开发环境设置

### 前置条件

- Node.js >= 18
- npm >= 8
- Git

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/LLL58/AGENT_Frontend_SURFACE_QA_Runner.git
cd AGENT_Frontend_SURFACE_QA_Runner

# 2. 进入前端目录
cd frontend

# 3. 安装依赖
npm install

# 4. 安装 Playwright 浏览器
npx playwright install

# 5. 运行测试
npm test
```

## 项目结构

```
frontend/
├── src/                    # 源代码
│   ├── core/              # 核心模块
│   ├── output/            # 输出模块
│   ├── utils/             # 工具函数
│   ├── config/            # 配置
│   ├── index.ts           # 模块导出入口
│   └── cli.ts             # CLI 入口
├── tests/                  # 测试
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/               # 端到端测试
├── sandbox/                # 沙盒测试环境
└── docs/                   # 文档
```

## 开发流程

### 1. 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feature/your-feature-name

# 或修复 bug
git checkout -b fix/your-bug-name
```

### 2. 编写代码

- 遵循 TypeScript 规范
- 添加必要的注释
- 保持代码简洁

### 3. 编写测试

```bash
# 运行测试
npm test

# 运行特定测试
npx vitest run tests/unit/specific.test.ts

# 监听模式
npm run test:watch
```

### 4. 提交代码

```bash
# 添加文件
git add .

# 提交（使用 conventional commits）
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复问题"
git commit -m "docs: 更新文档"
git commit -m "test: 添加测试"
```

### 5. 推送并创建 PR

```bash
# 推送分支
git push origin feature/your-feature-name

# 在 GitHub 上创建 Pull Request
```

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具相关 |

### 示例

```
feat: 添加无效果检测功能
fix: 修复选择器生成问题
docs: 更新 API 文档
test: 添加 RouteRunner 测试
```

## 代码规范

### TypeScript

- 使用严格模式
- 避免使用 `any`
- 添加类型注解
- 使用接口定义类型

### 命名规范

- 文件名：kebab-case（如 `route-runner.ts`）
- 类名：PascalCase（如 `RouteRunner`）
- 函数名：camelCase（如 `loadConfig`）
- 常量：UPPER_SNAKE_CASE（如 `DEFAULT_TIMEOUT`）

### 测试规范

- 每个模块对应一个测试文件
- 测试文件命名：`*.test.ts`
- 使用 describe/it 组织测试
- 测试覆盖率目标：80%+

## 文档规范

- 使用 Markdown 格式
- 包含代码示例
- 保持文档更新
- 使用中文或英文

## 问题反馈

### 提交 Issue

1. 使用 Issue 模板
2. 包含复现步骤
3. 包含错误信息
4. 包含环境信息

### Issue 模板

```markdown
## 问题描述
[简要描述问题]

## 复现步骤
1. ...
2. ...
3. ...

## 预期行为
[描述预期行为]

## 实际行为
[描述实际行为]

## 环境信息
- OS: [操作系统]
- Node.js: [版本]
- npm: [版本]
- Browser: [浏览器]

## 错误信息
[粘贴错误信息]
```

## 版本发布

### 版本号规则

使用 [语义化版本](https://semver.org/)：

- MAJOR.MINOR.PATCH
- 例如：1.1.0

### 发布流程

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 推送到远程

```bash
# 更新版本
npm version 1.1.0

# 创建标签
git tag -a v1.1.0 -m "v1.1.0"

# 推送
git push && git push --tags
```

## 联系方式

- GitHub Issues: https://github.com/LLL58/AGENT_Frontend_SURFACE_QA_Runner/issues

## 许可证

MIT License
