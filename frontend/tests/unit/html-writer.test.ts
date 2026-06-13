import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlWriter } from '../surface/output/html-writer.js';
import type { AgentIssue, AgentRunSummary, ReportConfig } from '../surface/core/types.js';

// Mock file utils
vi.mock('../surface/utils/file.js', () => ({
  writeFileEnsured: vi.fn().mockResolvedValue(undefined),
}));

describe('HtmlWriter', () => {
  let writer: HtmlWriter;

  const defaultConfig: ReportConfig = {
    enabled: true,
    formats: ['html'],
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
    totalIssues: 2,
    issueCountBySeverity: { critical: 1, error: 1, warning: 0, info: 0 },
    issueCountByCategory: { 'page-error': 1, 'network-error': 1 },
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
        pageErrors: ['TypeError: Cannot read properties of undefined'],
        screenshotPath: '.agent-feedback/artifacts/issue-001-screenshot.png',
      },
      agentHints: {
        suggestedCheck: '检查刷新按钮的事件处理函数',
      },
      createdAt: '2026-06-13T10:00:20.000Z',
    },
  ];

  beforeEach(() => {
    writer = new HtmlWriter('.agent-feedback', defaultConfig);
  });

  it('应该生成有效的 HTML 报告', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    expect(writeFileEnsured).toHaveBeenCalled();
    const callArgs = vi.mocked(writeFileEnsured).mock.calls[0];
    const content = callArgs[1] as string;

    // 验证 HTML 结构
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<html lang="zh-CN">');
    expect(content).toContain('<head>');
    expect(content).toContain('<body>');
    expect(content).toContain('Surface QA 测试报告');
  });

  it('应该包含正确的状态信息', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('❌');
    expect(content).toContain('失败');
    expect(content).toContain('http://localhost:3010');
  });

  it('应该包含统计信息', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('扫描页面');
    expect(content).toContain('扫描控件');
    expect(content).toContain('执行动作');
    expect(content).toContain('发现问题');
  });

  it('应该包含问题信息', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    await writer.writeReport(mockSummary, mockIssues);

    const content = vi.mocked(writeFileEnsured).mock.calls[0][1] as string;

    expect(content).toContain('页面运行时错误');
    expect(content).toContain('点击 "刷新" 按钮后发生 JavaScript 错误');
  });

  it('应该生成通过报告', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    const passedSummary: AgentRunSummary = {
      ...mockSummary,
      status: 'passed',
      totalIssues: 0,
    };

    await writer.writeReport(passedSummary, []);

    const mockCalls = vi.mocked(writeFileEnsured).mock.calls;
    const content = mockCalls[mockCalls.length - 1][1] as string;

    expect(content).toContain('通过');
    expect(content).toContain('所有测试通过');
  });
});
