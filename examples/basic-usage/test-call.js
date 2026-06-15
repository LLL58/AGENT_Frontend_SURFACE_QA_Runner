/**
 * Surface QA Agent Runner - 模块调用测试
 * 
 * 这个脚本测试模块是否可以正确导入和调用
 */

import { 
  loadConfig, 
  RouteRunner, 
  FeedbackSink, 
  routes,
  defaultConfig,
  VERSION,
  NAME,
  sleep,
  hashContent,
  RiskClassifier,
  IssueFactory
} from 'surface-qa-agent-runner';

console.log('测试 Surface QA Agent Runner 模块导入');
console.log('=' .repeat(50));

// 测试基本导入
console.log('\n1. 基本导入测试:');
console.log(`   版本: ${VERSION}`);
console.log(`   名称: ${NAME}`);

// 测试配置导入
console.log('\n2. 配置导入测试:');
console.log(`   默认 baseUrl: ${defaultConfig.baseUrl}`);
console.log(`   默认浏览器: ${defaultConfig.browser.name}`);
console.log(`   默认无头模式: ${defaultConfig.browser.headless}`);

// 测试路由导入
console.log('\n3. 路由导入测试:');
console.log(`   路由数量: ${routes.length}`);
for (const route of routes) {
  console.log(`   - ${route.id}: ${route.url}`);
}

// 测试工具函数
console.log('\n4. 工具函数测试:');
console.log(`   hashContent('test'): ${hashContent('test')}`);

// 测试类导入
console.log('\n5. 类导入测试:');
const riskClassifier = new RiskClassifier();
console.log(`   RiskClassifier 实例创建成功`);

const issueFactory = new IssueFactory();
console.log(`   IssueFactory 实例创建成功`);

// 测试风险分类
console.log('\n6. 风险分类测试:');
console.log(`   '查看详情': ${riskClassifier.classify({ text: '查看详情' })}`);
console.log(`   '保存': ${riskClassifier.classify({ text: '保存' })}`);
console.log(`   '删除': ${riskClassifier.classify({ text: '删除' })}`);

// 测试 Issue 创建
console.log('\n7. Issue 创建测试:');
const issue = issueFactory.create({
  runId: 'test-run',
  category: 'page-error',
  severity: 'critical',
  title: '测试错误',
  message: '这是一个测试错误',
  route: { id: 'test', name: '测试', url: '/test' },
  reproduceSteps: ['步骤1'],
  evidence: {},
  agentHints: {},
});
console.log(`   Issue ID: ${issue.id}`);
console.log(`   Issue 标题: ${issue.title}`);

console.log('\n' + '=' .repeat(50));
console.log('所有测试通过！');
console.log('=' .repeat(50));
