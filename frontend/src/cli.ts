#!/usr/bin/env node

/**
 * Surface QA Agent Runner CLI
 * 前端表层 Bug 自动巡检工具
 */

import { loadConfig } from './core/config-loader.js';
import { RouteRunner } from './core/route-runner.js';
import { FeedbackSink } from './output/feedback-sink.js';
import { routes } from './config/routes.js';
import type { SurfaceRoute } from './core/types.js';

// 检查是否是 ACP 模式
const args = process.argv.slice(2);
if (args[0] === 'acp') {
  // 动态导入 ACP 处理器
  const { AcpHandler } = await import('./acp/handler.js');
  const handler = new AcpHandler();
  await handler.start();
  process.exit(0);
}

/**
 * 解析命令行参数
 */
function parseArgs(): {
  baseUrl?: string;
  maxRoutes?: number;
  maxControls?: number;
  headless: boolean;
  ci: boolean;
  healthOnly: boolean;
  route?: string;
  output?: string;
  debug: boolean;
} {
  const args = process.argv.slice(2);

  return {
    baseUrl: args.find(a => a.startsWith('--baseUrl='))?.split('=')[1],
    maxRoutes: parseInt(args.find(a => a.startsWith('--max-routes='))?.split('=')[1] || '') || undefined,
    maxControls: parseInt(args.find(a => a.startsWith('--max-controls='))?.split('=')[1] || '') || undefined,
    headless: !args.includes('--headed'),
    ci: args.includes('--ci'),
    healthOnly: args.includes('--health-only'),
    route: args.find(a => a.startsWith('--route='))?.split('=')[1],
    output: args.find(a => a.startsWith('--output='))?.split('=')[1],
    debug: args.includes('--debug'),
  };
}

/**
 * 过滤路由
 */
function filterRoutes(routes: SurfaceRoute[], routeId?: string): SurfaceRoute[] {
  if (!routeId) return routes;
  return routes.filter(r => r.id === routeId || r.url === routeId);
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
Surface QA Agent Runner v1.0.0
前端表层 Bug 自动巡检工具

用法:
  surface-qa-agent [选项]

选项:
  --baseUrl=<url>        目标应用地址 (默认: http://localhost:3000)
  --max-routes=<n>       最大路由数 (默认: 10)
  --max-controls=<n>     每页最大控件数 (默认: 20)
  --route=<id>           只检查指定路由
  --output=<path>        输出目录 (默认: .agent-feedback)
  --health-only          只检查页面健康
  --headed               有头浏览器模式
  --debug                调试模式
  --ci                   CI 模式（失败时返回非0退出码）
  --help                 显示帮助信息

示例:
  surface-qa-agent --baseUrl=http://localhost:3000
  surface-qa-agent --route=login --headed
  surface-qa-agent --health-only --ci
  surface-qa-agent --max-routes=5 --max-controls=10
`);
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = parseArgs();

  // 显示帮助
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  try {
    // 加载配置
    const config = await loadConfig();

    // 应用命令行参数
    if (args.baseUrl) config.baseUrl = args.baseUrl;
    if (args.maxRoutes) config.scan.maxRoutes = args.maxRoutes;
    if (args.maxControls) config.scan.maxControls = args.maxControls;
    if (args.output) config.outputDir = args.output;
    config.browser.headless = args.headless;

    // 过滤路由
    const filteredRoutes = filterRoutes(routes, args.route);

    if (filteredRoutes.length === 0) {
      console.error('No routes to check');
      process.exit(1);
    }

    // 创建运行器
    const runner = new RouteRunner(config);

    // 运行检查
    const { summary, issues } = await runner.run(filteredRoutes);

    // 创建反馈系统
    const feedback = new FeedbackSink(config.outputDir, config);
    await feedback.init();

    // 保存问题
    for (const issue of issues) {
      await feedback.addIssue(issue);
    }

    // 生成摘要和报告
    await feedback.finish(summary);

    // 输出摘要到 stdout
    console.log(JSON.stringify({
      type: 'surface-qa.summary',
      status: summary.status,
      totalRoutes: summary.totalRoutes,
      checkedRoutes: summary.checkedRoutes,
      totalControls: summary.totalControls,
      totalActions: summary.totalActions,
      totalIssues: summary.totalIssues,
      summaryFile: summary.summaryFile,
      issuesFile: summary.issuesFile,
    }));

    // 设置退出码
    if (args.ci) {
      if (summary.status === 'failed') {
        process.exitCode = 1;
      } else if (summary.status === 'tool_error') {
        process.exitCode = 2;
      } else if (summary.status === 'environment_error') {
        process.exitCode = 3;
      } else {
        process.exitCode = 0;
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);

    // 输出致命错误到 stdout
    console.log(JSON.stringify({
      type: 'surface-qa.fatal',
      message: String(error),
      category: 'tool_error',
    }));

    process.exitCode = 2;
  }
}

// 运行主函数
main();
