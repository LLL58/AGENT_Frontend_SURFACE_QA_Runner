import type { Page } from 'playwright';
import type { ControlCandidate, ActionType } from './types.js';

/**
 * 动作执行器
 * 负责执行页面上的交互动作
 */
export class ActionExecutor {
  private actionTimeout: number;

  constructor(actionTimeout: number = 10000) {
    this.actionTimeout = actionTimeout;
  }

  /**
   * 执行动作
   */
  async execute(page: Page, control: ControlCandidate, actionType: ActionType = 'click'): Promise<void> {
    // 检查控件是否禁用
    if (control.disabled) {
      throw new Error(`Control ${control.id} is disabled`);
    }

    const selector = control.selector;

    try {
      switch (actionType) {
        case 'click':
          await this.executeClick(page, selector);
          break;
        case 'fill':
          await this.executeFill(page, selector);
          break;
        case 'select':
          await this.executeSelect(page, selector);
          break;
        case 'check':
          await this.executeCheck(page, selector);
          break;
        default:
          await this.executeClick(page, selector);
      }
    } catch (error) {
      throw new Error(`Failed to execute ${actionType} on ${selector}: ${error}`);
    }
  }

  /**
   * 执行点击动作
   */
  private async executeClick(page: Page, selector: string): Promise<void> {
    await page.click(selector, { timeout: this.actionTimeout });
  }

  /**
   * 执行填写动作
   */
  private async executeFill(page: Page, selector: string): Promise<void> {
    await page.fill(selector, 'test value', { timeout: this.actionTimeout });
  }

  /**
   * 执行选择动作
   */
  private async executeSelect(page: Page, selector: string): Promise<void> {
    await page.selectOption(selector, { index: 0 }, { timeout: this.actionTimeout });
  }

  /**
   * 执行勾选动作
   */
  private async executeCheck(page: Page, selector: string): Promise<void> {
    await page.check(selector, { timeout: this.actionTimeout });
  }
}
