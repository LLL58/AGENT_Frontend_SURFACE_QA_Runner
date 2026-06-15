import type { AgentIssue, AgentRunSummary, ReportConfig } from '../core/types.js';
import { writeFileEnsured } from '../utils/file.js';
import { resolve, join } from 'path';

/**
 * HTML 报告生成器
 * 负责生成人类可读的 HTML 格式报告
 */
export class HtmlWriter {
  private outputDir: string;
  private config: ReportConfig;

  constructor(outputDir: string, config: ReportConfig) {
    this.outputDir = resolve(outputDir);
    this.config = config;
  }

  /**
   * 生成 HTML 报告
   */
  async writeReport(summary: AgentRunSummary, issues: AgentIssue[]): Promise<string> {
    const report = this.generateReport(summary, issues);
    const filepath = join(this.outputDir, 'report.html');
    await writeFileEnsured(filepath, report);
    return filepath;
  }

  /**
   * 生成完整报告
   */
  private generateReport(summary: AgentRunSummary, issues: AgentIssue[]): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surface QA 测试报告</title>
  <style>
    ${this.generateStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${this.generateHeader()}
    ${this.generateSummarySection(summary)}
    ${this.generateStatisticsSection(summary)}
    ${this.generateKeyIssuesSection(issues)}
    ${this.generateDetailedIssuesSection(issues)}
    ${this.generateRecommendationsSection(issues)}
    ${this.generateFooter()}
  </div>
  <script>
    ${this.generateScripts()}
  </script>
</body>
</html>`;
  }

  /**
   * 生成样式
   */
  private generateStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 10px;
        margin-bottom: 30px;
        text-align: center;
      }

      .header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
      }

      .header p {
        font-size: 1.1rem;
        opacity: 0.9;
      }

      .section {
        background: white;
        padding: 25px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .section h2 {
        font-size: 1.5rem;
        margin-bottom: 20px;
        color: #333;
        border-bottom: 2px solid #667eea;
        padding-bottom: 10px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .summary-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }

      .summary-card .icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .summary-card .label {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 5px;
      }

      .summary-card .value {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
      }

      .status-badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 1rem;
      }

      .status-passed {
        background-color: #d4edda;
        color: #155724;
      }

      .status-failed {
        background-color: #f8d7da;
        color: #721c24;
      }

      .status-warning {
        background-color: #fff3cd;
        color: #856404;
      }

      .statistics-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      .statistics-table th,
      .statistics-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .statistics-table th {
        background-color: #f8f9fa;
        font-weight: 600;
      }

      .severity-bar {
        display: flex;
        height: 20px;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 10px;
      }

      .severity-critical {
        background-color: #dc3545;
      }

      .severity-error {
        background-color: #fd7e14;
      }

      .severity-warning {
        background-color: #ffc107;
      }

      .severity-info {
        background-color: #17a2b8;
      }

      .issue-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        transition: all 0.3s ease;
      }

      .issue-card:hover {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .issue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .issue-title {
        font-size: 1.2rem;
        font-weight: 600;
      }

      .issue-severity {
        padding: 4px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
      }

      .issue-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 10px;
        color: #666;
        font-size: 0.9rem;
      }

      .issue-description {
        margin-bottom: 15px;
        line-height: 1.6;
      }

      .issue-evidence {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        font-size: 0.9rem;
      }

      .issue-evidence a {
        color: #667eea;
        text-decoration: none;
      }

      .issue-evidence a:hover {
        text-decoration: underline;
      }

      .recommendation-card {
        border-left: 4px solid;
        padding: 15px;
        margin-bottom: 15px;
        background: #f8f9fa;
        border-radius: 0 8px 8px 0;
      }

      .recommendation-critical {
        border-left-color: #dc3545;
      }

      .recommendation-error {
        border-left-color: #fd7e14;
      }

      .recommendation-warning {
        border-left-color: #ffc107;
      }

      .recommendation-title {
        font-weight: 600;
        margin-bottom: 10px;
      }

      .recommendation-details {
        font-size: 0.9rem;
        color: #666;
      }

      .footer {
        text-align: center;
        padding: 20px;
        color: #666;
        font-size: 0.9rem;
      }

      .no-issues {
        text-align: center;
        padding: 40px;
        color: #28a745;
      }

      .no-issues .icon {
        font-size: 4rem;
        margin-bottom: 20px;
      }

      @media (max-width: 768px) {
        .container {
          padding: 10px;
        }

        .header h1 {
          font-size: 2rem;
        }

        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .issue-meta {
          flex-direction: column;
          gap: 5px;
        }
      }
    `;
  }

  /**
   * 生成头部
   */
  private generateHeader(): string {
    return `<div class="header">
      <h1>Surface QA 测试报告</h1>
      <p>前端表层 Bug 自动巡检工具生成的测试报告</p>
    </div>`;
  }

  /**
   * 生成执行摘要
   */
  private generateSummarySection(summary: AgentRunSummary): string {
    const statusIcon = this.getStatusIcon(summary.status);
    const statusText = this.getStatusText(summary.status);
    const statusClass = this.getStatusClass(summary.status);
    const duration = this.calculateDuration(summary.startedAt, summary.finishedAt);

    return `<div class="section">
      <h2>📊 执行摘要</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="icon">${statusIcon}</div>
          <div class="label">状态</div>
          <div class="value">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="icon">⏱️</div>
          <div class="label">执行时间</div>
          <div class="value">${this.formatDate(summary.startedAt)}</div>
        </div>
        <div class="summary-card">
          <div class="icon">⏳</div>
          <div class="label">耗时</div>
          <div class="value">${duration}</div>
        </div>
        <div class="summary-card">
          <div class="icon">🌐</div>
          <div class="label">目标应用</div>
          <div class="value">${summary.baseUrl}</div>
        </div>
      </div>
    </div>`;
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

    return `<div class="section">
      <h2>📈 统计概览</h2>
      <table class="statistics-table">
        <thead>
          <tr>
            <th>指标</th>
            <th>数量</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>扫描页面</td>
            <td>${summary.totalRoutes}</td>
          </tr>
          <tr>
            <td>检查页面</td>
            <td>${summary.checkedRoutes}</td>
          </tr>
          <tr>
            <td>扫描控件</td>
            <td>${summary.totalControls}</td>
          </tr>
          <tr>
            <td>执行动作</td>
            <td>${summary.totalActions}</td>
          </tr>
          <tr>
            <td>发现问题</td>
            <td><strong>${totalIssues}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>问题分布</h3>
      <table class="statistics-table">
        <thead>
          <tr>
            <th>严重程度</th>
            <th>数量</th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🔴 Critical</td>
            <td>${criticalCount}</td>
            <td>${this.calculatePercentage(criticalCount, totalIssues)}</td>
          </tr>
          <tr>
            <td>🟠 Error</td>
            <td>${errorCount}</td>
            <td>${this.calculatePercentage(errorCount, totalIssues)}</td>
          </tr>
          <tr>
            <td>🟡 Warning</td>
            <td>${warningCount}</td>
            <td>${this.calculatePercentage(warningCount, totalIssues)}</td>
          </tr>
          <tr>
            <td>🔵 Info</td>
            <td>${infoCount}</td>
            <td>${this.calculatePercentage(infoCount, totalIssues)}</td>
          </tr>
        </tbody>
      </table>

      <div class="severity-bar">
        ${criticalCount > 0 ? `<div class="severity-critical" style="width: ${this.calculatePercentage(criticalCount, totalIssues)}"></div>` : ''}
        ${errorCount > 0 ? `<div class="severity-error" style="width: ${this.calculatePercentage(errorCount, totalIssues)}"></div>` : ''}
        ${warningCount > 0 ? `<div class="severity-warning" style="width: ${this.calculatePercentage(warningCount, totalIssues)}"></div>` : ''}
        ${infoCount > 0 ? `<div class="severity-info" style="width: ${this.calculatePercentage(infoCount, totalIssues)}"></div>` : ''}
      </div>
    </div>`;
  }

  /**
   * 生成关键问题
   */
  private generateKeyIssuesSection(issues: AgentIssue[]): string {
    if (issues.length === 0) {
      return `<div class="section">
        <div class="no-issues">
          <div class="icon">✅</div>
          <h2>测试结果</h2>
          <p>所有测试通过，未发现任何问题。</p>
        </div>
      </div>`;
    }

    // 按严重程度排序
    const sortedIssues = [...issues].sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    });

    // 只显示前 5 个关键问题
    const keyIssues = sortedIssues.slice(0, 5);

    const issueCards = keyIssues.map(issue => {
      const icon = this.getSeverityIcon(issue.severity);
      const severityText = this.getSeverityText(issue.severity);
      const severityClass = `severity-${issue.severity}`;

      return `<div class="issue-card">
        <div class="issue-header">
          <div class="issue-title">${icon} ${issue.title}</div>
          <span class="issue-severity ${severityClass}">${severityText}</span>
        </div>
        <div class="issue-meta">
          <span>📄 ${issue.route.url}</span>
          <span>📁 ${issue.category}</span>
        </div>
        <div class="issue-description">
          ${issue.message}
        </div>
        ${this.generateEvidenceHtml(issue)}
      </div>`;
    });

    return `<div class="section">
      <h2>🔍 关键问题</h2>
      ${issueCards.join('\n')}
    </div>`;
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
      const severityClass = `severity-${issue.severity}`;

      return `<tr>
        <td>${index + 1}</td>
        <td><span class="issue-severity ${severityClass}">${icon} ${this.getSeverityText(issue.severity)}</span></td>
        <td>${issue.category}</td>
        <td>${issue.route.url}</td>
        <td>${issue.title}</td>
      </tr>`;
    });

    return `<div class="section">
      <h2>📋 详细问题列表</h2>
      <table class="statistics-table">
        <thead>
          <tr>
            <th>#</th>
            <th>严重程度</th>
            <th>类型</th>
            <th>页面</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.join('\n')}
        </tbody>
      </table>
    </div>`;
  }

  /**
   * 生成建议行动
   */
  private generateRecommendationsSection(issues: AgentIssue[]): string {
    if (issues.length === 0) {
      return `<div class="section">
        <h2>🎯 建议行动</h2>
        <p>无需采取任何行动，系统运行正常。</p>
      </div>`;
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const errorIssues = issues.filter(i => i.severity === 'error');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    const sections = [];

    if (criticalIssues.length > 0) {
      sections.push(`<h3>立即处理（Critical）</h3>
        ${criticalIssues.map(issue => 
          `<div class="recommendation-card recommendation-critical">
            <div class="recommendation-title">${issue.title}</div>
            <div class="recommendation-details">
              <p><strong>优先级:</strong> 高</p>
              <p><strong>影响:</strong> ${this.getImpactDescription(issue)}</p>
              <p><strong>建议:</strong> ${issue.agentHints?.suggestedCheck || '检查相关代码'}</p>
            </div>
          </div>`
        ).join('\n')}`);
    }

    if (errorIssues.length > 0) {
      sections.push(`<h3>尽快处理（Error）</h3>
        ${errorIssues.map(issue => 
          `<div class="recommendation-card recommendation-error">
            <div class="recommendation-title">${issue.title}</div>
            <div class="recommendation-details">
              <p><strong>优先级:</strong> 高</p>
              <p><strong>影响:</strong> ${this.getImpactDescription(issue)}</p>
              <p><strong>建议:</strong> ${issue.agentHints?.suggestedCheck || '检查相关代码'}</p>
            </div>
          </div>`
        ).join('\n')}`);
    }

    if (warningIssues.length > 0) {
      sections.push(`<h3>建议处理（Warning）</h3>
        ${warningIssues.map(issue => 
          `<div class="recommendation-card recommendation-warning">
            <div class="recommendation-title">${issue.title}</div>
            <div class="recommendation-details">
              <p><strong>优先级:</strong> 中</p>
              <p><strong>影响:</strong> ${this.getImpactDescription(issue)}</p>
              <p><strong>建议:</strong> ${issue.agentHints?.suggestedCheck || '检查相关代码'}</p>
            </div>
          </div>`
        ).join('\n')}`);
    }

    return `<div class="section">
      <h2>🎯 建议行动</h2>
      ${sections.join('\n')}
    </div>`;
  }

  /**
   * 生成证据 HTML
   */
  private generateEvidenceHtml(issue: AgentIssue): string {
    if (!this.config.includeEvidence) {
      return '';
    }

    const sections = [];

    // JavaScript 错误详情
    if (issue.evidence?.pageErrors && issue.evidence.pageErrors.length > 0) {
      const errorDetails = issue.evidence.pageErrors.map(error => {
        if (typeof error === 'string') {
          return `<div class="error-detail">
            <p><strong>错误消息:</strong> ${error}</p>
          </div>`;
        }
        return `<div class="error-detail">
          <p><strong>错误类型:</strong> ${error.type || 'Error'}</p>
          <p><strong>错误消息:</strong> ${error.message}</p>
        </div>`;
      }).join('');
      
      sections.push(`<div class="evidence-section">
        <h4>🔍 JavaScript 错误</h4>
        ${errorDetails}
      </div>`);
    }

    // 网络错误详情
    if (issue.evidence?.networkErrors && issue.evidence.networkErrors.length > 0) {
      const networkDetails = issue.evidence.networkErrors.map(error => {
        if (typeof error === 'string') {
          return `<div class="error-detail">
            <p><strong>错误:</strong> ${error}</p>
          </div>`;
        }
        
        let detail = `<p><strong>请求 URL:</strong> ${error.url}</p>`;
        detail += `<p><strong>请求方法:</strong> ${error.method}</p>`;
        
        if (error.status) {
          detail += `<p><strong>状态码:</strong> ${error.status} ${error.statusText || ''}</p>`;
        }
        
        if (error.requestHeaders) {
          detail += `<p><strong>请求头:</strong></p><pre>${JSON.stringify(error.requestHeaders, null, 2)}</pre>`;
        }
        
        if (error.requestBody) {
          detail += `<p><strong>请求体:</strong></p><pre>${error.requestBody}</pre>`;
        }
        
        if (error.responseHeaders) {
          detail += `<p><strong>响应头:</strong></p><pre>${JSON.stringify(error.responseHeaders, null, 2)}</pre>`;
        }
        
        if (error.responseBody) {
          try {
            const parsed = JSON.parse(error.responseBody);
            detail += `<p><strong>响应体:</strong></p><pre>${JSON.stringify(parsed, null, 2)}</pre>`;
          } catch {
            detail += `<p><strong>响应体:</strong></p><pre>${error.responseBody}</pre>`;
          }
        }
        
        return `<div class="error-detail">${detail}</div>`;
      }).join('');
      
      sections.push(`<div class="evidence-section">
        <h4>🌐 网络错误</h4>
        ${networkDetails}
      </div>`);
    }

    // 控制台错误
    if (issue.evidence?.consoleErrors && issue.evidence.consoleErrors.length > 0) {
      const consoleDetails = issue.evidence.consoleErrors
        .map(error => `<li><code>${error}</code></li>`)
        .join('');
      
      sections.push(`<div class="evidence-section">
        <h4>📝 控制台错误</h4>
        <ul>${consoleDetails}</ul>
      </div>`);
    }

    // 文件链接
    const fileLinks = [];
    if (issue.evidence?.screenshotPath) {
      fileLinks.push(`<a href="${issue.evidence.screenshotPath}" target="_blank">📸 截图</a>`);
    }
    if (issue.evidence?.htmlPath) {
      fileLinks.push(`<a href="${issue.evidence.htmlPath}" target="_blank">📄 HTML</a>`);
    }
    
    if (fileLinks.length > 0) {
      sections.push(`<div class="evidence-section">
        <h4>📁 证据文件</h4>
        <p>${fileLinks.join(' | ')}</p>
      </div>`);
    }

    if (sections.length === 0) {
      return '';
    }

    return `<div class="issue-evidence">
      ${sections.join('')}
    </div>`;
  }

  /**
   * 生成页脚
   */
  private generateFooter(): string {
    const now = new Date().toISOString();

    return `<div class="footer">
      <p>此报告由 Surface QA Agent Runner 自动生成</p>
      <p>工具版本: 1.0.0 | 报告生成时间: ${this.formatDate(now)}</p>
    </div>`;
  }

  /**
   * 生成脚本
   */
  private generateScripts(): string {
    return `
      // 添加交互功能
      document.addEventListener('DOMContentLoaded', function() {
        // 点击问题卡片展开/折叠详情
        const issueCards = document.querySelectorAll('.issue-card');
        issueCards.forEach(card => {
          card.addEventListener('click', function() {
            this.classList.toggle('expanded');
          });
        });
      });
    `;
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
   * 获取状态样式类
   */
  private getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'passed': 'status-passed',
      'passed_with_warnings': 'status-warning',
      'failed': 'status-failed',
      'tool_error': 'status-failed',
      'environment_error': 'status-failed',
    };
    return classes[status] || '';
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
