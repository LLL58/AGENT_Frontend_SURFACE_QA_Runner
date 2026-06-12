import type { Page } from 'playwright';
import type { AgentIssue, AgentRunSummary } from '../core/types.js';
import { ArtifactWriter } from './artifact-writer.js';
import { JsonWriter } from './json-writer.js';

/**
 * 反馈聚合器
 * 负责整合所有输出模块
 */
export class FeedbackSink {
  private artifactWriter: ArtifactWriter;
  private jsonWriter: JsonWriter;
  private issues: AgentIssue[] = [];

  constructor(outputDir: string) {
    this.artifactWriter = new ArtifactWriter(outputDir);
    this.jsonWriter = new JsonWriter(outputDir);
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    await this.artifactWriter.init();
  }

  /**
   * 添加 Issue
   */
  async addIssue(issue: AgentIssue): Promise<void> {
    this.issues.push(issue);

    // 输出到 stdout
    this.jsonWriter.writeIssueToStdout(issue);

    // 写入 NDJSON 文件
    await this.jsonWriter.writeIssueNdjson(issue);

    // 写入单个 Issue JSON 文件
    await this.jsonWriter.writeIssueJson(issue);
  }

  /**
   * 保存证据
   */
  async saveArtifacts(page: Page, issueId: string): Promise<{
    screenshotPath: string;
    htmlPath: string;
    domSnapshotPath: string;
  }> {
    const [screenshotPath, htmlPath, domSnapshotPath] = await Promise.all([
      this.artifactWriter.writeScreenshot(page, issueId),
      this.artifactWriter.writeHtml(page, issueId),
      this.artifactWriter.writeDomSnapshot(page, issueId),
    ]);

    return { screenshotPath, htmlPath, domSnapshotPath };
  }

  /**
   * 完成并生成摘要
   */
  async finish(summary: AgentRunSummary): Promise<void> {
    // 写入摘要文件
    await this.jsonWriter.writeSummary(summary);

    // 输出摘要到 stdout
    this.jsonWriter.writeSummaryToStdout(summary);
  }

  /**
   * 获取所有 Issue
   */
  getIssues(): AgentIssue[] {
    return [...this.issues];
  }

  /**
   * 获取证据目录
   */
  getArtifactsDir(): string {
    return this.artifactWriter.getArtifactsDir();
  }
}
