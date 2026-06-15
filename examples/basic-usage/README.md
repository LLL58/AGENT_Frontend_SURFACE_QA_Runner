# Surface QA Agent Runner - 基本使用示例

这个示例演示了如何通过模块调用方式使用 Surface QA Agent Runner。

## 安装

```bash
# 进入示例目录
cd examples/basic-usage

# 安装依赖
npm install
```

## 使用

### 测试模块导入

```bash
npm test
```

这个命令会测试所有模块是否可以正确导入。

### 运行完整检查

```bash
# 使用默认地址（http://localhost:3000）
npm start

# 使用自定义地址
node index.js http://localhost:8080
```

## 代码说明

### index.js

这是完整的使用示例，演示了：

1. 如何导入模块
2. 如何加载配置
3. 如何创建运行器
4. 如何运行检查
5. 如何生成报告
6. 如何处理结果

### test-call.js

这是模块导入测试，验证：

1. 基本模块导入
2. 配置导入
3. 路由导入
4. 工具函数导入
5. 类导入
6. 功能测试

## Agent 集成示例

### 基本调用

```javascript
import { loadConfig, RouteRunner, routes } from 'surface-qa-agent-runner';

async function checkFrontend(baseUrl) {
  const config = await loadConfig();
  config.baseUrl = baseUrl;
  
  const runner = new RouteRunner(config);
  const { summary, issues } = await runner.run(routes);
  
  return { summary, issues };
}
```

### 带错误处理的调用

```javascript
import { loadConfig, RouteRunner, FeedbackSink, routes } from 'surface-qa-agent-runner';

async function runWithFeedback(baseUrl) {
  try {
    const config = await loadConfig();
    config.baseUrl = baseUrl;
    
    const runner = new RouteRunner(config);
    const { summary, issues } = await runner.run(routes);
    
    // 生成报告
    const feedback = new FeedbackSink(config.outputDir, config);
    await feedback.init();
    
    for (const issue of issues) {
      await feedback.addIssue(issue);
    }
    
    await feedback.finish(summary);
    
    return {
      success: summary.status === 'passed',
      summary,
      issues,
    };
  } catch (error) {
    console.error('检查失败:', error);
    throw error;
  }
}
```

### Agent 工作流

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function agentWorkflow(baseUrl) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`尝试 ${attempts}/${maxAttempts}`);
    
    // 运行检查
    const { stdout } = await execAsync(
      `node index.js ${baseUrl}`,
      { timeout: 300000 }
    );
    
    // 解析结果
    const lines = stdout.split('\n');
    let status = 'unknown';
    
    for (const line of lines) {
      if (line.includes('状态:')) {
        status = line.split(':')[1].trim();
        break;
      }
    }
    
    if (status === 'passed') {
      console.log('测试通过！');
      return true;
    }
    
    console.log('测试失败，等待修复...');
    // 这里可以添加自动修复逻辑
  }
  
  console.log('达到最大尝试次数');
  return false;
}
```

## 输出示例

```
Surface QA Agent Runner v1.0.0
==================================================
目标应用: http://localhost:3000

1. 加载配置...
   ✓ 配置加载完成
2. 创建运行器...
   ✓ 运行器创建完成
3. 运行检查...
   检查路由: /, /login, /dashboard, /profile, /error
   ✓ 检查完成
4. 生成报告...
   ✓ 报告生成完成

==================================================
检查结果:
==================================================
状态: failed
扫描页面: 5
检查页面: 5
扫描控件: 29
执行动作: 12
发现问题: 27

问题分布:
  Critical: 0
  Error: 17
  Warning: 10
  Info: 0

报告位置:
  .agent-feedback/report.md
  .agent-feedback/report.html
==================================================
```

## 注意事项

1. 确保目标应用正在运行
2. 确保已安装 Playwright 浏览器（`npx playwright install`）
3. 首次运行可能需要较长时间
