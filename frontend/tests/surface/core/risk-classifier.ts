import type { ControlCandidate, RiskLevel } from './types.js';

/**
 * 风险分类器
 * 负责对控件进行风险分类
 */
export class RiskClassifier {
  private dangerWords: string[];
  private warningWords: string[];

  constructor() {
    this.dangerWords = [
      '删除', 'delete', '移除', 'remove',
      '支付', 'pay', '退款', 'refund',
      '注销', '退出', 'logout', 'signout',
      '取消', 'cancel',
    ];

    this.warningWords = [
      '保存', 'save', '提交', 'submit',
      '创建', 'create', '发布', 'publish',
      '更新', 'update', '修改', 'edit',
      '确认', 'confirm',
    ];
  }

  /**
   * 分类风险等级
   */
  classify(control: ControlCandidate): RiskLevel {
    const text = (control.text || '').toLowerCase();
    const ariaLabel = (control.ariaLabel || '').toLowerCase();
    const combinedText = `${text} ${ariaLabel}`;

    // 检查危险词
    if (this.dangerWords.some(word => combinedText.includes(word))) {
      return 'danger';
    }

    // 检查警告词
    if (this.warningWords.some(word => combinedText.includes(word))) {
      return 'warning';
    }

    return 'safe';
  }

  /**
   * 判断是否应该执行
   * 默认只执行 safe 级别的控件
   */
  shouldExecute(control: ControlCandidate, allowWarning: boolean = false): boolean {
    const risk = this.classify(control);
    
    if (risk === 'safe') {
      return true;
    }

    if (risk === 'warning' && allowWarning) {
      return true;
    }

    return false;
  }
}
