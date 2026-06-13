import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkdownWriter } from '../surface/output/markdown-writer.js';
import type { AgentIssue, AgentRunSummary, ReportConfig } from '../surface/core/types.js';

// Mock file utils
vi.mock('../surface/utils/file.js', () => ({
  writeFileEnsured: vi.fn().mockResolvedValue(undefined),
}));

describe('MarkdownWriter', () => {
  let writer: MarkdownWriter;

  const defaultConfig: ReportConfig = {
    enabled: true,
    formats: ['markdown'],
    language: 'zh-CN',
    includeEvidence: true,
    includeRecommendations: true,
  };

  const mockSummary: AgentRunSummary = {
    runId: 'run-123',
    status: 'failed',
    startedAt: '2026-06-13T10:00:00.000Z',
    finishedAt: '2026-06-13T10:01:00.000Z',
    baseUrl: 'http://localhost:3010',
    totalRoutes: 5,
    checkedRoutes: 5,
    totalControls: 20,
    totalActions: 15,
    totalIssues: 3,
    issueCountBySeverity: { critical: 1, error: 1, warning: 1, info: 0 },
    issueCountByCategory: { 'page-error': 1, 'network-error': 1, 'no-observable-effect': 1 },
    feedbackDir: '.agent-feedback',
    summaryFile: '.agent-feedback/run-summary.json',
    issuesFile: '.agent-feedback/issues.ndjson',
    artifactsDir: '.agent-feedback/artifacts',
  };

  const mockIssues: AgentIssue[] = [
    {
      id: 'issue-001',
      runId: 'run-123',
      category: 'page-error',
      severity: 'critical',
      title: '页面运行时错误',
      message: '点击 "刷新" 按钮后发生 JavaScript 错误',
      route: { id: 'dashboard', name: '仪表盘', url: '/dashboard' },
      action: { type: 'click', selector: '#refresh-button', text: '刷新' },
      reproduceSteps: ['打开页面：/dashboard', '点击控件：刷新'],
      evidence: {
        pageErrors: [
          { message: 'Cannot read properties of undefined (reading \'refresh\')', type: 'TypeError' },
        ],
        consoleErrors: ['Warning: Each child in a list should have a unique "key" prop.'],
        screenshotPath: '.agent-feedback/artifacts/issue-001-screenshot.png',
        htmlPath: '.agent-feedback/artifacts/issue-001-page.html',
      },
      agentHints: {
        suggestedCheck: '检查刷新按钮的事件处理函数',
        shouldInspectConsole: true,
      },
      createdAt: '2026-06-13T10:00:20.000Z',
    },
    {
      id: 'issue-002',
      runId: 'run-123',
      category: 'network-error',
      severity: 'error',
      title: '网络请求失败',
      message: '保存资料时 API 返回 500 错误',
      route: { id: 'profile', name: '个人资料', url: '/profile' },
      action: { type: 'click', selector: '#save-button', text: '保存' },
      reproduceSteps: ['打开页面：/profile', '点击控件：保存'],
      evidence: {
        networkErrors: [
          {
            url: 'http://localhost:3010/api/users/1',
            method: 'PUT',
            status: 500,
            statusText: 'Internal Server Error',
            requestHeaders: { 'content-type': 'application/json' },
            requestBody: '{"name":"test","email":"test@example.com"}',
            responseHeaders: { 'content-type': 'application/json' },
            responseBody: '{"error":"Internal Server Error","message":"Database connection failed"}',
          },
        ],
        screenshotPath: '.agent-feedback/artifacts/issue-002-screenshot.png',
      },
      agentHints: {
        suggestedCheck: '检查后端 API 服务状态',
        shouldInspectNetwork: true,
      },
      createdAt: '2026-06-13T10:00:30.000Z',
    },
    {
      id: 'issue-003',
      runId: 'run-123',
      category: 'no-observable-effect',
      severity: 'warning',
      title: '控件操作后无效果',
      message: '点击 "点击无效果" 按钮后未观察到任何变化',
      route: { id: 'home', name: '主页', url: '/' },
      action: { type: 'click', selector: '#no-effect-button', text: '点击无效果' },
      reproduceSteps: ['打开页面：/', '点击控件：点击无效果'],
      evidence: {
        screenshotPath: '.agent-feedback/artifacts/issue-003-screenshot.png',
      },
      agentHints: {
        suggestedCheck: '检查按钮是否绑定了事件处理函数',
        shouldInspectDOM: true,
      },
      createdAt: '2026-06-13T10:00:40.000Z',
    },
  ];

  beforeEach(() => {
    writer = new MarkdownWriter('.agent-feedback', defaultConfig);
  });

  it('应该生成有效的 Markdown 报告', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    expect(writeFileEnsured).toHaveBeenCalled();
    const callArgs = vi.mocked(writeFileEnsured).mock.calls[0];
    const content = callArgs[1] as string;

    // 验证报告结构
    expect(content).toContain('# Surface QA 测试报告');
    expect(content).toContain('## 📊 执行摘要');
    expect(content).toContain('## 📈 统计概览');
    expect(content).toContain('## 🔍 关键问题');
    expect(content).toContain('## 📋 详细问题列表');
    expect(content).toContain('## 🎯 建议行动');
  });

  it('应该包含正确的状态信息', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('❌ 失败');
    expect(content).toContain('http://localhost:3010');
  });

  it('应该包含正确的统计信息', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('| 扫描页面 | 5 |');
    expect(content).toContain('| 扫描控件 | 20 |');
    expect(content).toContain('| 执行动作 | 15 |');
    expect(content).toContain('| 发现问题 | 3 |');
  });

  it('应该包含关键问题', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('页面运行时错误');
    expect(content).toContain('网络请求失败');
    expect(content).toContain('控件操作后无效果');
  });

  it('应该包含建议行动', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('立即处理（Critical）');
    expect(content).toContain('尽快处理（Error）');
    expect(content).toContain('建议处理（Warning）');
  });

  it('应该生成通过报告', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    const passedSummary: AgentRunSummary = {
      ...mockSummary,
      status: 'passed',
      totalIssues: 0,
      issueCountBySeverity: { critical: 0, error: 0, warning: 0, info: 0 },
    };

    await writer.writeReport(passedSummary, []);

    const mockCalls = vi.mocked(writeFileEnsured).mock.calls;
    const content = mockCalls[mockCalls.length - 1][1] as string;

    expect(content).toContain('通过');
    expect(content).toContain('所有测试通过');
  });
});
