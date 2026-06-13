import type { Page } from 'playwright';
import type { ControlCandidate, ControlType } from './types.js';

/**
 * 控件扫描器
 * 负责扫描页面上的可交互控件
 */
export class ControlScanner {
  /**
   * 扫描页面控件
   */
  async scan(page: Page, maxControls: number = 20): Promise<ControlCandidate[]> {
    const controls: ControlCandidate[] = [];

    // 扫描按钮
    const buttons = await this.scanButtons(page);
    controls.push(...buttons);

    // 扫描链接
    const links = await this.scanLinks(page);
    controls.push(...links);

    // 扫描输入框
    const inputs = await this.scanInputs(page);
    controls.push(...inputs);

    // 扫描选择框
    const selects = await this.scanSelects(page);
    controls.push(...selects);

    // 过滤不可见控件
    const visibleControls = controls.filter(c => c.visible);

    // 限制数量
    return visibleControls.slice(0, maxControls);
  }

  /**
   * 扫描按钮
   */
  private async scanButtons(page: Page): Promise<ControlCandidate[]> {
    return page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
      return Array.from(buttons).map((el, index) => ({
        id: `button-${index}`,
        type: 'button' as ControlType,
        selector: el.getAttribute('data-testid') 
          ? `[data-testid="${el.getAttribute('data-testid')}"]`
          : el.id 
            ? `#${el.id}`
            : `button:nth-of-type(${index + 1})`,
        text: (el.textContent || '').trim().substring(0, 50),
        visible: el.offsetParent !== null,
        disabled: (el as HTMLButtonElement).disabled,
        risk: 'safe' as const,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        testId: el.getAttribute('data-testid'),
      }));
    });
  }

  /**
   * 扫描链接
   */
  private async scanLinks(page: Page): Promise<ControlCandidate[]> {
    return page.evaluate(() => {
      const links = document.querySelectorAll('a[href]');
      return Array.from(links).map((el, index) => ({
        id: `link-${index}`,
        type: 'link' as ControlType,
        selector: el.getAttribute('data-testid')
          ? `[data-testid="${el.getAttribute('data-testid')}"]`
          : el.id
            ? `#${el.id}`
            : `a:nth-of-type(${index + 1})`,
        text: (el.textContent || '').trim().substring(0, 50),
        visible: el.offsetParent !== null,
        disabled: false,
        risk: 'safe' as const,
        tag: 'a',
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        testId: el.getAttribute('data-testid'),
        href: el.getAttribute('href'),
      }));
    });
  }

  /**
   * 扫描输入框
   */
  private async scanInputs(page: Page): Promise<ControlCandidate[]> {
    return page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
      return Array.from(inputs).map((el, index) => ({
        id: `input-${index}`,
        type: 'input' as ControlType,
        selector: el.getAttribute('data-testid')
          ? `[data-testid="${el.getAttribute('data-testid')}"]`
          : el.id
            ? `#${el.id}`
            : el.getAttribute('name')
              ? `input[name="${el.getAttribute('name')}"]`
              : `input:nth-of-type(${index + 1})`,
        text: el.getAttribute('placeholder') || '',
        visible: el.offsetParent !== null,
        disabled: (el as HTMLInputElement).disabled,
        risk: 'safe' as const,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        testId: el.getAttribute('data-testid'),
      }));
    });
  }

  /**
   * 扫描选择框
   */
  private async scanSelects(page: Page): Promise<ControlCandidate[]> {
    return page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      return Array.from(selects).map((el, index) => ({
        id: `select-${index}`,
        type: 'select' as ControlType,
        selector: el.getAttribute('data-testid')
          ? `[data-testid="${el.getAttribute('data-testid')}"]`
          : el.id
            ? `#${el.id}`
            : `select:nth-of-type(${index + 1})`,
        text: (el as HTMLSelectElement).options[(el as HTMLSelectElement).selectedIndex]?.text || '',
        visible: el.offsetParent !== null,
        disabled: (el as HTMLSelectElement).disabled,
        risk: 'safe' as const,
        tag: 'select',
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        testId: el.getAttribute('data-testid'),
      }));
    });
  }
}
