import type { AgentIssue, AgentRunSummary } from '../core/types.js';
import { writeFileEnsured } from '../utils/file.js';
import { resolve, join } from 'path';

/**
 * JSON 写入器
 * 负责输出 JSON 格式的结果
 */
export class JsonWriter {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = resolve(outputDir);
  }

  /**
   * 写入运行摘要
   */
  async writeSummary(summary: AgentRunSummary): Promise<string> {
    const filepath = join(this.outputDir, 'run-summary.json');
    await writeFileEnsured(filepath, JSON.stringify(summary, null, 2));
    return filepath;
  }

  /**
   * 写入 Issue 到 NDJSON 文件
   */
  async writeIssueNdjson(issue: AgentIssue): Promise<void> {
    const filepath = join(this.outputDir, 'issues.ndjson');
    const line = JSON.stringify({ type: 'issue', issue }) + '\n';
    await writeFileEnsured(filepath, line);
  }

  /**
   * 写入单个 Issue JSON 文件
   */
  async writeIssueJson(issue: AgentIssue): Promise<string> {
    const issuesDir = join(this.outputDir, 'issues');
    const filepath = join(issuesDir, `${issue.id}.json`);
    await writeFileEnsured(filepath, JSON.stringify(issue, null, 2));
    return filepath;
  }

  /**
   * 输出 Issue 到 stdout
   */
  writeIssueToStdout(issue: AgentIssue): void {
    const output = {
      type: 'surface-qa.issue',
      issueId: issue.id,
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      route: issue.route.url,
      action: issue.action,
      message: issue.message,
    };
    console.log(JSON.stringify(output));
  }

  /**
   * 输出摘要到 stdout
   */
  writeSummaryToStdout(summary: AgentRunSummary): void {
    const output = {
      type: 'surface-qa.summary',
      status: summary.status,
      totalRoutes: summary.totalRoutes,
      totalActions: summary.totalActions,
      totalIssues: summary.totalIssues,
      summaryFile: summary.summaryFile,
      issuesFile: summary.issuesFile,
    };
    console.log(JSON.stringify(output));
  }

  /**
   * 输出致命错误到 stdout
   */
  writeFatalToStdout(message: string): void {
    const output = {
      type: 'surface-qa.fatal',
      message,
      category: 'tool_error',
    };
    console.log(JSON.stringify(output));
  }
}
