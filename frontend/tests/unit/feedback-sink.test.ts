import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackSink } from '../surface/output/feedback-sink.js';
import type { AgentIssue, AgentRunSummary } from '../surface/core/types.js';

// Mock 依赖
vi.mock('../surface/output/artifact-writer.js', () => ({
  ArtifactWriter: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    writeScreenshot: vi.fn().mockResolvedValue('/path/screenshot.png'),
    writeHtml: vi.fn().mockResolvedValue('/path/page.html'),
    writeDomSnapshot: vi.fn().mockResolvedValue('/path/dom.json'),
    getArtifactsDir: vi.fn().mockReturnValue('/path/artifacts'),
  })),
}));

vi.mock('../surface/output/json-writer.js', () => ({
  JsonWriter: vi.fn().mockImplementation(() => ({
    writeSummary: vi.fn().mockResolvedValue('/path/summary.json'),
    writeIssueNdjson: vi.fn().mockResolvedValue(undefined),
    writeIssueJson: vi.fn().mockResolvedValue('/path/issue.json'),
    writeIssueToStdout: vi.fn(),
    writeSummaryToStdout: vi.fn(),
  })),
}));

describe('FeedbackSink', () => {
  let sink: FeedbackSink;

  const mockIssue: AgentIssue = {
    id: 'issue-001',
    runId: 'run-123',
    category: 'page-error',
    severity: 'critical',
    title: 'Test Error',
    message: 'Test message',
    route: { id: 'test', name: 'Test', url: '/test' },
    reproduceSteps: ['Step 1'],
    evidence: {},
    agentHints: {},
    createdAt: new Date().toISOString(),
  };

  const mockSummary: AgentRunSummary = {
    runId: 'run-123',
    status: 'passed',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    baseUrl: 'http://localhost:3000',
    totalRoutes: 1,
    checkedRoutes: 1,
    totalControls: 5,
    totalActions: 3,
    totalIssues: 0,
    issueCountBySeverity: { critical: 0, error: 0, warning: 0, info: 0 },
    issueCountByCategory: {},
    feedbackDir: '.agent-feedback/test',
    summaryFile: '.agent-feedback/test/run-summary.json',
    issuesFile: '.agent-feedback/test/issues.ndjson',
    artifactsDir: '.agent-feedback/test/artifacts',
  };

  const mockPage = {
    screenshot: vi.fn().mockResolvedValue(Buffer.from('screenshot')),
    content: vi.fn().mockResolvedValue('<html></html>'),
    evaluate: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    sink = new FeedbackSink('.agent-feedback/test');
    vi.clearAllMocks();
  });

  it('should initialize feedback system', async () => {
    await sink.init();
    // 验证初始化成功（不抛出异常）
    expect(true).toBe(true);
  });

  it('should add issue', async () => {
    await sink.addIssue(mockIssue);
    const issues = sink.getIssues();
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe('issue-001');
  });

  it('should save artifacts', async () => {
    const result = await sink.saveArtifacts(mockPage as any, 'issue-001');
    expect(result.screenshotPath).toBe('/path/screenshot.png');
    expect(result.htmlPath).toBe('/path/page.html');
    expect(result.domSnapshotPath).toBe('/path/dom.json');
  });

  it('should generate summary', async () => {
    await sink.finish(mockSummary);
    // 验证摘要生成成功（不抛出异常）
    expect(true).toBe(true);
  });
});
