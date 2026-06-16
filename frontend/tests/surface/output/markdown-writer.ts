import type { AgentIssue, AgentRunSummary, ReportConfig } from '../core/types.js';
import { writeFileEnsured } from '../utils/file.js';
import { resolve, join } from 'path';

/**
 * Markdown 报告生成器
 * 负责生成人类可读的 Markdown 格式报告
 */
export class MarkdownWriter {
  private outputDir: string;
  private config: ReportConfig;

  constructor(outputDir: string, config: ReportConfig) {
    this.outputDir = resolve(outputDir);
    this.config = config;
  }

  /**
   * 生成 Markdown 报告
   */
  async writeReport(summary: AgentRunSummary, issues: AgentIssue[]): Promise<string> {
    const report = this.generateReport(summary, issues);
    const filepath = join(this.outputDir, 'report.md');
    await writeFileEnsured(filepath, report);
    return filepath;
  }

  /**
   * 生成完整报告
   */
  private generateReport(summary: AgentRunSummary, issues: AgentIssue[]): string {
    const sections = [
      this.generateHeader(),
      this.generateSummarySection(summary),
      this.generateStatisticsSection(summary),
      this.generateKeyIssuesSection(issues),
      this.generateDetailedIssuesSection(issues),
      this.generateRecommendationsSection(issues),
      this.generateFooter(),
    ];

    return sections.join('\n\n');
  }

  /**
   * 生成报告头部
   */
  private generateHeader(): string {
    return `# Surface QA 测试报告`;
  }

  /**
   * 生成执行摘要
   */
  private generateSummarySection(summary: AgentRunSummary): string {
    const statusIcon = this.getStatusIcon(summary.status);
    const statusText = this.getStatusText(summary.status);
    const duration = this.calculateDuration(summary.startedAt, summary.finishedAt);

    return `## 📊 执行摘要

| 指标 | 值 |
|------|-----|
| 状态 | ${statusIcon} ${statusText} |
| 执行时间 | ${this.formatDate(summary.startedAt)} |
| 耗时 | ${duration} |
| 目标应用 | ${summary.baseUrl} |
| 运行 ID | ${summary.runId} |`;
  }

  /**
   * 生成统计概览
   */
  private generateStatisticsSection(summary: AgentRunSummary): string {
    const issueCountBySeverity = summary.issueCountBySeverity || {};
    const totalIssues = summary.totalIssues || 0;

    const criticalCount = issueCountBySeverity['critical'] || 0;
    const errorCount = issueCountBySeverity['error'] || 0;
    const warningCount = issueCountBySeverity['warning'] || 0;
    const infoCount = issueCountBySeverity['info'] || 0;

    return `## 📈 统计概览

| 指标 | 数量 |
|------|------|
| 扫描页面 | ${summary.totalRoutes} |
| 检查页面 | ${summary.checkedRoutes} |
| 扫描控件 | ${summary.totalControls} |
| 执行动作 | ${summary.totalActions} |
| 发现问题 | ${totalIssues} |

### 问题分布

| 严重程度 | 数量 | 占比 |
|----------|------|------|
| 🔴 Critical | ${criticalCount} | ${this.calculatePercentage(criticalCount, totalIssues)} |
| 🟠 Error | ${errorCount} | ${this.calculatePercentage(errorCount, totalIssues)} |
| 🟡 Warning | ${warningCount} | ${this.calculatePercentage(warningCount, totalIssues)} |
| 🔵 Info | ${infoCount} | ${this.calculatePercentage(infoCount, totalIssues)} |`;
  }

  /**
   * 生成关键问题
   */
  private generateKeyIssuesSection(issues: AgentIssue[]): string {
    if (issues.length === 0) {
      return `## ✅ 测试结果

所有测试通过，未发现任何问题。`;
    }

    // 按严重程度排序
    const sortedIssues = [...issues].sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    });

    // 只显示前 5 个关键问题
    const keyIssues = sortedIssues.slice(0, 5);

    const issueSections = keyIssues.map((issue, index) => {
      const icon = this.getSeverityIcon(issue.severity);
      const evidenceLinks = this.generateEvidenceLinks(issue);

      return `### ${index + 1}. [${icon} ${this.getSeverityText(issue.severity)}] ${issue.title}

**页面**: ${issue.route.url}  
**描述**: ${issue.message}  
**影响**: ${this.getImpactDescription(issue)}  
**建议**: ${issue.agentHints?.suggestedCheck || '检查相关代码'}

${evidenceLinks}`;
    });

    return `## 🔍 关键问题

${issueSections.join('\n\n')}`;
  }

  /**
   * 生成详细问题列表
   */
  private generateDetailedIssuesSection(issues: AgentIssue[]): string {
    if (issues.length === 0) {
      return '';
    }

    const tableRows = issues.map((issue, index) => {
      const icon = this.getSeverityIcon(issue.severity);
      return `| ${index + 1} | ${icon} ${this.getSeverityText(issue.severity)} | ${issue.category} | ${issue.route.url} | ${issue.title} |`;
    });

    return `## 📋 详细问题列表

| # | 严重程度 | 类型 | 页面 | 描述 |
|---|----------|------|------|------|
${tableRows.join('\n')}`;
  }

  /**
   * 生成建议行动
   */
  private generateRecommendationsSection(issues: AgentIssue[]): string {
    if (issues.length === 0) {
      return `## 🎯 建议行动

无需采取任何行动，系统运行正常。`;
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const errorIssues = issues.filter(i => i.severity === 'error');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    const sections = [];

    if (criticalIssues.length > 0) {
      sections.push(`### 立即处理（Critical）

${criticalIssues.map((issue, index) => 
        `${index + 1}. **${issue.title}**
   - 优先级: 高
   - 影响: ${this.getImpactDescription(issue)}
   - 建议: ${issue.agentHints?.suggestedCheck || '检查相关代码'}`
      ).join('\n')}`);
    }

    if (errorIssues.length > 0) {
      sections.push(`### 尽快处理（Error）

${errorIssues.map((issue, index) => 
        `${index + 1}. **${issue.title}**
   - 优先级: 高
   - 影响: ${this.getImpactDescription(issue)}
   - 建议: ${issue.agentHints?.suggestedCheck || '检查相关代码'}`
      ).join('\n')}`);
    }

    if (warningIssues.length > 0) {
      sections.push(`### 建议处理（Warning）

${warningIssues.map((issue, index) => 
        `${index + 1}. **${issue.title}**
   - 优先级: 中
   - 影响: ${this.getImpactDescription(issue)}
   - 建议: ${issue.agentHints?.suggestedCheck || '检查相关代码'}`
      ).join('\n')}`);
    }

    return `## 🎯 建议行动

${sections.join('\n\n')}`;
  }

  /**
   * 生成报告尾部
   */
  private generateFooter(): string {
    const now = new Date().toISOString();

    return `---

*此报告由 Surface QA Agent Runner 自动生成*

- 工具版本: 1.0.0
- 报告生成时间: ${this.formatDate(now)}
- 报告格式: Markdown`;
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'passed': '✅',
      'passed_with_warnings': '⚠️',
      'failed': '❌',
      'tool_error': '🔧',
      'environment_error': '🌐',
    };
    return icons[status] || '❓';
  }

  /**
   * 获取状态文本
   */
  private getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'passed': '通过',
      'passed_with_warnings': '有警告',
      'failed': '失败',
      'tool_error': '工具错误',
      'environment_error': '环境错误',
    };
    return texts[status] || '未知';
  }

  /**
   * 获取严重程度图标
   */
  private getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      'critical': '🔴',
      'error': '🟠',
      'warning': '🟡',
      'info': '🔵',
    };
    return icons[severity] || '⚪';
  }

  /**
   * 获取严重程度文本
   */
  private getSeverityText(severity: string): string {
    const texts: Record<string, string> = {
      'critical': 'Critical',
      'error': 'Error',
      'warning': 'Warning',
      'info': 'Info',
    };
    return texts[severity] || 'Unknown';
  }

  /**
   * 获取影响描述
   */
  private getImpactDescription(issue: AgentIssue): string {
    const impacts: Record<string, string> = {
      'page-error': '页面功能异常，用户无法正常使用',
      'network-error': '网络请求失败，数据无法加载或保存',
      'white-screen': '页面白屏，用户无法看到任何内容',
      'action-timeout': '操作超时，用户可能需要等待或重试',
      'no-observable-effect': '操作无效果，用户体验差',
      'console-error': '控制台错误，可能影响功能',
      'request-failed': '请求失败，数据无法获取',
      'stuck-loading': '加载卡住，用户需要等待',
      'locator-error': '元素定位失败，功能可能异常',
      'unexpected-navigation': '意外跳转，用户可能迷失',
    };
    return impacts[issue.category] || '需要进一步检查';
  }

  /**
   * 生成证据链接
   */
  private generateEvidenceLinks(issue: AgentIssue): string {
    if (!this.config.includeEvidence) {
      return '';
    }

    const sections = [];

    // JavaScript 错误详情
    if (issue.evidence?.pageErrors && issue.evidence.pageErrors.length > 0) {
      const errorDetails = issue.evidence.pageErrors.map(error => {
        if (typeof error === 'string') {
          return `**错误消息**: ${error}`;
        }
        let detail = `**错误类型**: ${error.type || 'Error'}`;
        detail += `\n**错误消息**: ${error.message}`;
        return detail;
      }).join('\n\n');
      
      sections.push(`### 🔍 JavaScript 错误\n\n${errorDetails}`);
    }

    // 网络错误详情
    if (issue.evidence?.networkErrors && issue.evidence.networkErrors.length > 0) {
      const networkDetails = issue.evidence.networkErrors.map(error => {
        if (typeof error === 'string') {
          return `**错误**: ${error}`;
        }
        
        let detail = `**请求 URL**: ${error.url}`;
        detail += `\n**请求方法**: ${error.method}`;
        
        if (error.status) {
          detail += `\n**状态码**: ${error.status} ${error.statusText || ''}`;
        }
        
        if (error.requestHeaders) {
          detail += `\n**请求头**:\n\`\`\`json\n${JSON.stringify(error.requestHeaders, null, 2)}\n\`\`\``;
        }
        
        if (error.requestBody) {
          detail += `\n**请求体**:\n\`\`\`json\n${error.requestBody}\n\`\`\``;
        }
        
        if (error.responseHeaders) {
          detail += `\n**响应头**:\n\`\`\`json\n${JSON.stringify(error.responseHeaders, null, 2)}\n\`\`\``;
        }
        
        if (error.responseBody) {
          // 尝试格式化 JSON
          try {
            const parsed = JSON.parse(error.responseBody);
            detail += `\n**响应体**:\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
          } catch {
            detail += `\n**响应体**:\n\`\`\`\n${error.responseBody}\n\`\`\``;
          }
        }
        
        return detail;
      }).join('\n\n');
      
      sections.push(`### 🌐 网络错误\n\n${networkDetails}`);
    }

    // 控制台错误
    if (issue.evidence?.consoleErrors && issue.evidence.consoleErrors.length > 0) {
      const consoleDetails = issue.evidence.consoleErrors
        .map(error => `- \`${error}\``)
        .join('\n');
      
      sections.push(`### 📝 控制台错误\n\n${consoleDetails}`);
    }

    // 文件链接
    const fileLinks = [];
    if (issue.evidence?.screenshotPath) {
      fileLinks.push(`- 📸 截图: [查看](${issue.evidence.screenshotPath})`);
    }
    if (issue.evidence?.htmlPath) {
      fileLinks.push(`- 📄 HTML: [查看](${issue.evidence.htmlPath})`);
    }
    
    if (fileLinks.length > 0) {
      sections.push(`### 📁 证据文件\n\n${fileLinks.join('\n')}`);
    }

    if (sections.length === 0) {
      return '';
    }

    return `\n${sections.join('\n\n')}`;
  }

  /**
   * 计算百分比
   */
  private calculatePercentage(count: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  }

  /**
   * 计算持续时间
   */
  private calculateDuration(startedAt: string, finishedAt: string): string {
    const start = new Date(startedAt);
    const end = new Date(finishedAt);
    const durationMs = end.getTime() - start.getTime();
    const durationSec = Math.round(durationMs / 1000);
    return `${durationSec} 秒`;
  }

  /**
   * 格式化日期
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
