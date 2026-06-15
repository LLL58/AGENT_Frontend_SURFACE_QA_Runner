/**
 * Surface QA Agent Runner - 基本使用示例
 * 
 * 这个示例演示了如何通过模块调用方式使用 Surface QA Agent Runner
 */

import { 
  loadConfig, 
  RouteRunner, 
  FeedbackSink, 
  routes,
  defaultConfig,
  VERSION,
  NAME
} from 'surface-qa-agent-runner';

/**
 * 运行 Surface QA 检查
 */
async function runSurfaceQA(baseUrl) {
  console.log(`\n${NAME} v${VERSION}`);
  console.log('=' .repeat(50));
  console.log(`目标应用: ${baseUrl}\n`);

  try {
    // 1. 加载配置
    console.log('1. 加载配置...');
    const config = await loadConfig();
    config.baseUrl = baseUrl;
    console.log('   ✓ 配置加载完成');

    // 2. 创建运行器
    console.log('2. 创建运行器...');
    const runner = new RouteRunner(config);
    console.log('   ✓ 运行器创建完成');

    // 3. 运行检查
    console.log('3. 运行检查...');
    console.log(`   检查路由: ${routes.map(r => r.url).join(', ')}`);
    const { summary, issues } = await runner.run(routes);
    console.log('   ✓ 检查完成');

    // 4. 创建反馈系统
    console.log('4. 生成报告...');
    const feedback = new FeedbackSink(config.outputDir, config);
    await feedback.init();

    // 5. 保存问题
    for (const issue of issues) {
      await feedback.addIssue(issue);
    }

    // 6. 生成摘要和报告
    await feedback.finish(summary);
    console.log('   ✓ 报告生成完成');

    // 7. 输出结果
    console.log('\n' + '=' .repeat(50));
    console.log('检查结果:');
    console.log('=' .repeat(50));
    console.log(`状态: ${summary.status}`);
    console.log(`扫描页面: ${summary.totalRoutes}`);
    console.log(`检查页面: ${summary.checkedRoutes}`);
    console.log(`扫描控件: ${summary.totalControls}`);
    console.log(`执行动作: ${summary.totalActions}`);
    console.log(`发现问题: ${summary.totalIssues}`);
    
    if (issues.length > 0) {
      console.log('\n问题分布:');
      const severityCount = {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0
      };
      
      for (const issue of issues) {
        severityCount[issue.severity]++;
      }
      
      console.log(`  Critical: ${severityCount.critical}`);
      console.log(`  Error: ${severityCount.error}`);
      console.log(`  Warning: ${severityCount.warning}`);
      console.log(`  Info: ${severityCount.info}`);
    }

    console.log('\n报告位置:');
    console.log(`  ${config.outputDir}/report.md`);
    console.log(`  ${config.outputDir}/report.html`);
    console.log('=' .repeat(50));

    return { summary, issues };
  } catch (error) {
    console.error('\n错误:', error.message);
    throw error;
  }
}

// 获取命令行参数
const baseUrl = process.argv[2] || 'http://localhost:3000';

// 运行
runSurfaceQA(baseUrl)
  .then(({ summary }) => {
    process.exit(summary.status === 'passed' ? 0 : 1);
  })
  .catch(() => {
    process.exit(2);
  });
