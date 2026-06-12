import type { AgentIssue, AgentIssueCategory, AgentIssueSeverity } from '../core/types.js';

/**
 * Issue 工厂
 * 负责创建 Issue 对象
 */
export class IssueFactory {
  /**
   * 创建 Issue
   */
  create(params: {
    runId: string;
    category: AgentIssueCategory;
    severity: AgentIssueSeverity;
    title: string;
    message: string;
    route: { id: string; name: string; url: string };
    action?: { type: string; selector?: string; text?: string };
    reproduceSteps: string[];
    evidence: AgentIssue['evidence'];
    agentHints: AgentIssue['agentHints'];
  }): AgentIssue {
    return {
      id: this.generateId(),
      runId: params.runId,
      category: params.category,
      severity: params.severity,
      title: params.title,
      message: params.message,
      route: params.route,
      action: params.action,
      reproduceSteps: params.reproduceSteps,
      evidence: params.evidence,
      agentHints: params.agentHints,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `issue-${timestamp}-${random}`;
  }
}
