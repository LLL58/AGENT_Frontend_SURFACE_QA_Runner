import type { Page } from 'playwright';
import type { AgentIssue, AgentRunSummary, SurfaceConfig } from '../core/types.js';
import { ArtifactWriter } from './artifact-writer.js';
import { JsonWriter } from './json-writer.js';
import { MarkdownWriter } from './markdown-writer.js';
import { HtmlWriter } from './html-writer.js';

/**
 * 反馈聚合器
 * 负责整合所有输出模块
 */
export class FeedbackSink {
  private artifactWriter: ArtifactWriter;
  private jsonWriter: JsonWriter;
  private markdownWriter: MarkdownWriter;
  private htmlWriter: HtmlWriter;
  private issues: AgentIssue[] = [];
  private config: SurfaceConfig;

  constructor(outputDir: string, config: SurfaceConfig) {
    this.config = config;
    this.artifactWriter = new ArtifactWriter(outputDir);
    this.jsonWriter = new JsonWriter(outputDir);
    this.markdownWriter = new MarkdownWriter(outputDir, config.report);
    this.htmlWriter = new HtmlWriter(outputDir, config.report);
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

    // 生成人类可读报告
    if (this.config.report.enabled) {
      const formats = this.config.report.formats;

      if (formats.includes('markdown')) {
        const markdownPath = await this.markdownWriter.writeReport(summary, this.issues);
        console.log(`📝 Markdown 报告已生成: ${markdownPath}`);
      }

      if (formats.includes('html')) {
        const htmlPath = await this.htmlWriter.writeReport(summary, this.issues);
        console.log(`🌐 HTML 报告已生成: ${htmlPath}`);
      }
    }
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
