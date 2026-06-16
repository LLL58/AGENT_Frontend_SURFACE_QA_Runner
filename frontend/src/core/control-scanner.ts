import type { Page, Frame } from 'playwright';
import type { ControlCandidate, ControlType } from './types.js';
import { logger } from '../utils/logger.js';

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

    // 扫描主页面
    const mainFrameControls = await this.scanFrame(page, 'main');
    controls.push(...mainFrameControls);

    // 扫描 iframe
    const frames = page.frames();
    for (const frame of frames) {
      if (frame !== page.mainFrame()) {
        try {
          const frameControls = await this.scanFrame(frame, frame.url());
          controls.push(...frameControls);
        } catch (error) {
          logger.debug(`扫描 iframe 失败: ${frame.url()}`, error);
        }
      }
    }

    // 过滤不可见控件
    const visibleControls = controls.filter(c => c.visible);

    // 限制数量
    return visibleControls.slice(0, maxControls);
  }

  /**
   * 扫描单个 frame
   */
  private async scanFrame(frame: Page | Frame, frameId: string): Promise<ControlCandidate[]> {
    const controls: ControlCandidate[] = [];

    // 扫描按钮
    const buttons = await this.scanButtons(frame, frameId);
    controls.push(...buttons);

    // 扫描链接
    const links = await this.scanLinks(frame, frameId);
    controls.push(...links);

    // 扫描输入框
    const inputs = await this.scanInputs(frame, frameId);
    controls.push(...inputs);

    // 扫描选择框
    const selects = await this.scanSelects(frame, frameId);
    controls.push(...selects);

    return controls;
  }

  /**
   * 扫描按钮
   */
  private async scanButtons(frame: Page | Frame, frameId: string): Promise<ControlCandidate[]> {
    try {
      return await frame.evaluate((fId) => {
        const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
        return Array.from(buttons).map((el, index) => {
          // 生成稳定的选择器
          const testId = el.getAttribute('data-testid');
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const className = el.className;
          
          let selector = '';
          if (testId) {
            selector = `[data-testid="${testId}"]`;
          } else if (id) {
            selector = `#${id}`;
          } else if (ariaLabel) {
            selector = `button[aria-label="${ariaLabel}"]`;
          } else if (className && typeof className === 'string') {
            const firstClass = className.split(' ')[0];
            if (firstClass && !firstClass.includes('[')) {
              selector = `button.${firstClass}`;
            } else {
              selector = `button:nth-child(${index + 1})`;
            }
          } else {
            selector = `button:nth-child(${index + 1})`;
          }

          return {
            id: `${fId}-button-${index}`,
            type: 'button' as ControlType,
            selector,
            text: (el.textContent || '').trim().substring(0, 50),
            visible: (el as HTMLElement).offsetParent !== null,
            disabled: (el as HTMLButtonElement).disabled,
            risk: 'safe' as const,
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role'),
            ariaLabel,
            testId,
          };
        });
      }, frameId);
    } catch (error) {
      logger.debug(`扫描按钮失败: ${frameId}`, error);
      return [];
    }
  }

  /**
   * 扫描链接
   */
  private async scanLinks(frame: Page | Frame, frameId: string): Promise<ControlCandidate[]> {
    try {
      return await frame.evaluate((fId) => {
        const links = document.querySelectorAll('a[href]');
        return Array.from(links).map((el, index) => {
          // 生成稳定的选择器
          const testId = el.getAttribute('data-testid');
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const href = el.getAttribute('href');
          const text = (el.textContent || '').trim().substring(0, 30);
          
          let selector = '';
          if (testId) {
            selector = `[data-testid="${testId}"]`;
          } else if (id) {
            selector = `#${id}`;
          } else if (ariaLabel) {
            selector = `a[aria-label="${ariaLabel}"]`;
          } else if (href && href !== '#') {
            selector = `a[href="${href}"]`;
          } else if (text) {
            // 使用文本内容作为选择器（如果唯一）
            selector = `a:has-text("${text}")`;
          } else {
            selector = `a:nth-child(${index + 1})`;
          }

          return {
            id: `${fId}-link-${index}`,
            type: 'link' as ControlType,
            selector,
            text,
            visible: (el as HTMLElement).offsetParent !== null,
            disabled: false,
            risk: 'safe' as const,
            tag: 'a',
            role: el.getAttribute('role'),
            ariaLabel,
            testId,
            href,
          };
        });
      }, frameId);
    } catch (error) {
      logger.debug(`扫描链接失败: ${frameId}`, error);
      return [];
    }
  }

  /**
   * 扫描输入框
   */
  private async scanInputs(frame: Page | Frame, frameId: string): Promise<ControlCandidate[]> {
    try {
      return await frame.evaluate((fId) => {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
        return Array.from(inputs).map((el, index) => {
          // 生成稳定的选择器
          const testId = el.getAttribute('data-testid');
          const id = el.id;
          const name = el.getAttribute('name');
          const placeholder = el.getAttribute('placeholder');
          
          let selector = '';
          if (testId) {
            selector = `[data-testid="${testId}"]`;
          } else if (id) {
            selector = `#${id}`;
          } else if (name) {
            selector = `${el.tagName.toLowerCase()}[name="${name}"]`;
          } else if (placeholder) {
            selector = `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;
          } else {
            selector = `${el.tagName.toLowerCase()}:nth-child(${index + 1})`;
          }

          return {
            id: `${fId}-input-${index}`,
            type: 'input' as ControlType,
            selector,
            text: placeholder || '',
            visible: (el as HTMLElement).offsetParent !== null,
            disabled: (el as HTMLInputElement).disabled,
            risk: 'safe' as const,
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            testId,
          };
        });
      }, frameId);
    } catch (error) {
      logger.debug(`扫描输入框失败: ${frameId}`, error);
      return [];
    }
  }

  /**
   * 扫描选择框
   */
  private async scanSelects(frame: Page | Frame, frameId: string): Promise<ControlCandidate[]> {
    try {
      return await frame.evaluate((fId) => {
        const selects = document.querySelectorAll('select');
        return Array.from(selects).map((el, index) => {
          // 生成稳定的选择器
          const testId = el.getAttribute('data-testid');
          const id = el.id;
          const name = el.getAttribute('name');
          
          let selector = '';
          if (testId) {
            selector = `[data-testid="${testId}"]`;
          } else if (id) {
            selector = `#${id}`;
          } else if (name) {
            selector = `select[name="${name}"]`;
          } else {
            selector = `select:nth-child(${index + 1})`;
          }

          return {
            id: `${fId}-select-${index}`,
            type: 'select' as ControlType,
            selector,
            text: (el as HTMLSelectElement).options[(el as HTMLSelectElement).selectedIndex]?.text || '',
            visible: (el as HTMLElement).offsetParent !== null,
            disabled: (el as HTMLSelectElement).disabled,
            risk: 'safe' as const,
            tag: 'select',
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            testId,
          };
        });
      }, frameId);
    } catch (error) {
      logger.debug(`扫描选择框失败: ${frameId}`, error);
      return [];
    }
  }
}
