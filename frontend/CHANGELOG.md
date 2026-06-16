# Changelog

本文件记录 Surface QA Agent Runner 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [1.2.0] - 2026-06-16

### 新增
- 无效果检测功能（检测控件操作后无任何效果）
- iframe 支持（扫描 iframe 内的控件）
- 浏览器复用（BrowserPool，提升性能）
- storage-state 认证支持
- 配置文件支持（surface.config.ts）
- 完整的单元测试覆盖（161个测试用例）
- 沙盒测试环境（9个测试页面，11个API端点）
- 人类可读测试报告（Markdown 和 HTML 格式）

### 修复
- 修复 TypeScript 编译错误（110+ 错误）
- 修复空 catch 块，添加日志记录
- 修复选择器生成算法，避免使用 nth-of-type
- 修复 config-loader 缺少 effectCheck 和 report 配置
- 修复 FeedbackSink 参数问题
- 修复性能测试阈值

### 改进
- 改进错误处理，所有模块添加日志
- 改进选择器稳定性，优先使用 data-testid
- 改进页面加载等待时间
- 改进测试覆盖（161个测试用例，100%通过）
- 改进文档（README、API、故障排查）

## [1.1.0] - 2026-06-16

### 新增
- 沙盒测试环境（9个测试页面，11个API端点）
- 无效果检测功能（检测无功能按钮和链接）
- 前端bug报错信息展示（JavaScript错误、网络错误详情）
- 人类可读测试报告（Markdown 和 HTML 格式）
- 模块调用支持（Agent 可通过 import 方式调用）
- CLI 入口支持
- RouteRunner 单元测试
- 日志工具 (utils/logger.ts)

### 修复
- 修复空 catch 块，添加日志记录
- 修复选择器生成算法，避免使用 nth-of-type
- 修复 config-loader 缺少 effectCheck 和 report 配置
- 修复 FeedbackSink 参数问题
- 修复性能测试阈值

### 改进
- 改进错误处理，所有模块添加日志
- 改进选择器稳定性，优先使用 data-testid
- 改进页面加载等待时间
- 改进测试覆盖（145个测试用例）

## [1.0.0] - 2026-06-15

### 新增
- 初始版本
- 页面健康检查（白屏、JavaScript错误、网络错误）
- 控件扫描（按钮、链接、输入框等）
- 风险分类（safe/warning/danger）
- 动作执行（点击、填写、选择）
- 错误收集（console.error、pageerror、网络请求错误）
- 证据保存（截图、HTML、DOM快照）
- 结构化输出（JSON、NDJSON格式）
- 测试报告生成（Markdown、HTML）
- CLI 和模块调用支持
