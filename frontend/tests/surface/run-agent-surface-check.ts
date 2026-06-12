import { loadConfig } from './core/config-loader.js';
import { RouteRunner } from './core/route-runner.js';
import { FeedbackSink } from './output/feedback-sink.js';
import { routes } from './config/routes.js';
import type { SurfaceRoute } from './core/types.js';

/**
 * 解析命令行参数
 */
function parseArgs(): {
  ci: boolean;
  healthOnly: boolean;
  route?: string;
  maxRoutes?: number;
  maxControls?: number;
  allowWarning: boolean;
  headed: boolean;
  debug: boolean;
  output?: string;
} {
  const args = process.argv.slice(2);
  
  return {
    ci: args.includes('--ci'),
    healthOnly: args.includes('--health-only'),
    route: args.find(a => a.startsWith('--route='))?.split('=')[1],
    maxRoutes: parseInt(args.find(a => a.startsWith('--max-routes='))?.split('=')[1] || '') || undefined,
    maxControls: parseInt(args.find(a => a.startsWith('--max-controls='))?.split('=')[1] || '') || undefined,
    allowWarning: args.includes('--allow-warning'),
    headed: args.includes('--headed'),
    debug: args.includes('--debug'),
    output: args.find(a => a.startsWith('--output='))?.split('=')[1],
  };
}

/**
 * 过滤路由
 */
function filterRoutes(routes: SurfaceRoute[], routeId?: string): SurfaceRoute[] {
  if (routeId) {
    return routes.filter(r => r.id === routeId || r.url === routeId);
  }
  return routes;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = parseArgs();

  try {
    // 加载配置
    const config = await loadConfig();

    // 应用命令行参数
    if (args.output) {
      config.outputDir = args.output;
    }
    if (args.maxRoutes) {
      config.scan.maxRoutes = args.maxRoutes;
    }
    if (args.maxControls) {
      config.scan.maxControls = args.maxControls;
    }
    if (args.headed) {
      config.browser.headless = false;
    }

    // 过滤路由
    const filteredRoutes = filterRoutes(routes, args.route);

    if (filteredRoutes.length === 0) {
      console.error('No routes to check');
      process.exit(1);
    }

    // 初始化反馈系统
    const feedback = new FeedbackSink(config.outputDir);
    await feedback.init();

    // 创建路由运行器
    const runner = new RouteRunner(config);

    // 运行检查
    const { summary, issues } = await runner.run(filteredRoutes);

    // 保存所有 Issue
    for (const issue of issues) {
      await feedback.addIssue(issue);
    }

    // 生成摘要
    await feedback.finish(summary);

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
    process.exitCode = 2;
  }
}

// 运行主函数
main();
