import { describe, it, expect } from 'vitest';
import { IssueFactory } from '../surface/output/issue-factory.js';

describe('IssueFactory', () => {
  let factory: IssueFactory;

  beforeEach(() => {
    factory = new IssueFactory();
  });

  const mockParams = {
    runId: 'run-123',
    category: 'page-error' as const,
    severity: 'critical' as const,
    title: '页面运行时错误',
    message: 'Cannot read properties of undefined',
    route: { id: 'test', name: '测试页', url: '/test' },
    reproduceSteps: ['打开页面：/test', '点击按钮'],
    evidence: {
      consoleErrors: ['TypeError: Cannot read properties'],
      pageErrors: [{ message: 'Error', stack: 'stack trace' }],
    },
    agentHints: {
      suggestedCheck: '检查变量是否初始化',
      shouldInspectConsole: true,
    },
  };

  it('should create a valid Issue object', () => {
    const issue = factory.create(mockParams);

    expect(issue).toBeDefined();
    expect(issue.id).toBeDefined();
    expect(issue.runId).toBe('run-123');
    expect(issue.category).toBe('page-error');
    expect(issue.severity).toBe('critical');
    expect(issue.title).toBe('页面运行时错误');
    expect(issue.message).toBe('Cannot read properties of undefined');
    expect(issue.route).toEqual({ id: 'test', name: '测试页', url: '/test' });
    expect(issue.reproduceSteps).toEqual(['打开页面：/test', '点击按钮']);
  });

  it('should generate unique ID with correct format', () => {
    const issue1 = factory.create(mockParams);
    const issue2 = factory.create(mockParams);

    // ID 格式: issue-<timestamp>-<random>
    expect(issue1.id).toMatch(/^issue-\d+-[a-z0-9]+$/);
    expect(issue2.id).toMatch(/^issue-\d+-[a-z0-9]+$/);

    // 两次生成的 ID 应该不同
    expect(issue1.id).not.toBe(issue2.id);
  });

  it('should include all required fields', () => {
    const issue = factory.create(mockParams);

    // 必需字段
    expect(issue.id).toBeDefined();
    expect(issue.runId).toBeDefined();
    expect(issue.category).toBeDefined();
    expect(issue.severity).toBeDefined();
    expect(issue.title).toBeDefined();
    expect(issue.message).toBeDefined();
    expect(issue.route).toBeDefined();
    expect(issue.reproduceSteps).toBeDefined();
    expect(issue.createdAt).toBeDefined();
  });

  it('should set createdAt to valid ISO timestamp', () => {
    const issue = factory.create(mockParams);

    // 验证是有效的 ISO 时间字符串
    const date = new Date(issue.createdAt);
    expect(date.getTime()).not.toBeNaN();

    // 验证是最近的时间（within 1 second）
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    expect(diff).toBeLessThan(1000);
  });

  it('should handle optional fields', () => {
    // 不带可选字段
    const minimalParams = {
      runId: 'run-456',
      category: 'console-error' as const,
      severity: 'warning' as const,
      title: '控制台警告',
      message: 'Warning message',
      route: { id: 'home', name: '首页', url: '/' },
      reproduceSteps: ['打开首页'],
      evidence: {},
      agentHints: {},
    };

    const issue = factory.create(minimalParams);

    expect(issue.action).toBeUndefined();
    expect(issue.evidence).toEqual({});
    expect(issue.agentHints).toEqual({});
  });
});
