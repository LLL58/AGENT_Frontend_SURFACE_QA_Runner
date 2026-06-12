import type { Page } from 'playwright';
import { ensureDir, writeFileEnsured } from '../utils/file.js';
import { resolve, join } from 'path';

/**
 * 证据写入器
 * 负责保存截图、HTML等证据文件
 */
export class ArtifactWriter {
  private artifactsDir: string;

  constructor(outputDir: string) {
    this.artifactsDir = resolve(outputDir, 'artifacts');
  }

  /**
   * 初始化目录
   */
  async init(): Promise<void> {
    await ensureDir(this.artifactsDir);
  }

  /**
   * 保存截图
   */
  async writeScreenshot(page: Page, issueId: string): Promise<string> {
    const filename = `${issueId}-screenshot.png`;
    const filepath = join(this.artifactsDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  /**
   * 保存HTML
   */
  async writeHtml(page: Page, issueId: string): Promise<string> {
    const filename = `${issueId}-page.html`;
    const filepath = join(this.artifactsDir, filename);
    const html = await page.content();
    await writeFileEnsured(filepath, html);
    return filepath;
  }

  /**
   * 保存DOM快照
   */
  async writeDomSnapshot(page: Page, issueId: string): Promise<string> {
    const filename = `${issueId}-dom.json`;
    const filepath = join(this.artifactsDir, filename);
    
    const domSnapshot = await page.evaluate(() => {
      const snapshot = {
        title: document.title,
        url: window.location.href,
        bodyLength: document.body?.innerText?.length || 0,
        elementCount: document.querySelectorAll('*').length,
        forms: Array.from(document.forms).map(f => ({
          id: f.id,
          action: f.action,
          method: f.method,
        })),
        links: Array.from(document.links).slice(0, 50).map(l => ({
          href: l.href,
          text: l.textContent?.trim().substring(0, 50),
        })),
      };
      return snapshot;
    });

    await writeFileEnsured(filepath, JSON.stringify(domSnapshot, null, 2));
    return filepath;
  }

  /**
   * 获取证据目录
   */
  getArtifactsDir(): string {
    return this.artifactsDir;
  }
}
