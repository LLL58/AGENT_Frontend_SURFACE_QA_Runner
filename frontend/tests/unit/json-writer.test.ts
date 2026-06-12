import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JsonWriter } from '../surface/output/json-writer.js';
import type { AgentIssue, AgentRunSummary } from '../surface/core/types.js';
import { resolve, join } from 'path';

// Mock file utils
vi.mock('../surface/utils/file.js', () => ({
  writeFileEnsured: vi.fn().mockResolvedValue(undefined),
}));

describe('JsonWriter', () => {
  let writer: JsonWriter;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const outputDir = resolve('test', 'output');

  const mockIssue: AgentIssue = {
    id: 'issue-001',
    runId: 'run-123',
    category: 'page-error',
    severity: 'critical',
    title: '页面错误',
    message: 'Cannot read properties',
    route: { id: 'test', name: '测试页', url: '/test' },
    reproduceSteps: ['打开页面'],
    evidence: {},
    agentHints: {},
    createdAt: '2026-06-12T10:00:00.000Z',
  };

  const mockSummary: AgentRunSummary = {
    runId: 'run-123',
    status: 'failed',
    startedAt: '2026-06-12T10:00:00.000Z',
    finishedAt: '2026-06-12T10:01:00.000Z',
    baseUrl: 'http://localhost:3000',
    totalRoutes: 3,
    checkedRoutes: 3,
    totalControls: 10,
    totalActions: 5,
    totalIssues: 2,
    issueCountBySeverity: { critical: 1, error: 1, warning: 0, info: 0 },
    issueCountByCategory: { 'page-error': 1, 'network-error': 1 },
    feedbackDir: '.agent-feedback',
    summaryFile: '.agent-feedback/run-summary.json',
    issuesFile: '.agent-feedback/issues.ndjson',
    artifactsDir: '.agent-feedback/artifacts',
  };

  beforeEach(() => {
    writer = new JsonWriter(outputDir);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should write summary file', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    
    const filepath = await writer.writeSummary(mockSummary);
    const expectedPath = join(outputDir, 'run-summary.json');

    expect(filepath).toBe(expectedPath);
    expect(writeFileEnsured).toHaveBeenCalledWith(
      expectedPath,
      expect.stringContaining('"runId": "run-123"')
    );
  });

  it('should write issue to NDJSON file', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    const expectedPath = join(outputDir, 'issues.ndjson');

    await writer.writeIssueNdjson(mockIssue);

    expect(writeFileEnsured).toHaveBeenCalledWith(
      expectedPath,
      expect.stringContaining('"type":"issue"')
    );
  });

  it('should write single issue JSON file', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    const expectedPath = join(outputDir, 'issues', 'issue-001.json');

    const filepath = await writer.writeIssueJson(mockIssue);

    expect(filepath).toBe(expectedPath);
    expect(writeFileEnsured).toHaveBeenCalledWith(
      expectedPath,
      expect.stringContaining('"id": "issue-001"')
    );
  });

  it('should write issue to stdout', () => {
    writer.writeIssueToStdout(mockIssue);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.type).toBe('surface-qa.issue');
    expect(output.issueId).toBe('issue-001');
    expect(output.severity).toBe('critical');
    expect(output.category).toBe('page-error');
    expect(output.title).toBe('页面错误');
    expect(output.route).toBe('/test');
  });

  it('should write summary to stdout', () => {
    writer.writeSummaryToStdout(mockSummary);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.type).toBe('surface-qa.summary');
    expect(output.status).toBe('failed');
    expect(output.totalRoutes).toBe(3);
    expect(output.totalActions).toBe(5);
    expect(output.totalIssues).toBe(2);
  });
});
