import type { Page, BrowserContext } from 'playwright';
import type { SurfaceConfig } from './types.js';
import { logger } from '../utils/logger.js';
import { readFileContent, fileExists } from '../utils/file.js';

/**
 * 认证引导器
 * 负责处理各种认证模式
 */
export class AuthBootstrap {
  /**
   * 根据配置执行登录
   */
  async loginIfNeeded(page: Page, config: SurfaceConfig): Promise<void> {
    switch (config.auth.mode) {
      case 'none':
        logger.debug('无认证模式，跳过登录');
        return;
      case 'login-form':
        await this.loginWithForm(page, config);
        break;
      case 'storage-state':
        await this.loadStorageState(page, config);
        break;
      default:
        logger.warn(`未知的认证模式: ${config.auth.mode}`);
    }
  }

  /**
   * 使用表单登录
   */
  private async loginWithForm(page: Page, config: SurfaceConfig): Promise<void> {
    logger.info('开始表单登录...');

    try {
      // 导航到登录页
      if (config.auth.loginUrl) {
        await page.goto(config.auth.loginUrl, {
          timeout: config.browser.timeout,
        });
      }

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // 填写用户名
      if (config.auth.usernameSelector && config.auth.username) {
        await page.fill(config.auth.usernameSelector, config.auth.username, {
          timeout: 5000,
        });
        logger.debug('用户名已填写');
      }

      // 填写密码
      if (config.auth.passwordSelector && config.auth.password) {
        await page.fill(config.auth.passwordSelector, config.auth.password, {
          timeout: 5000,
        });
        logger.debug('密码已填写');
      }

      // 点击提交按钮
      if (config.auth.submitSelector) {
        await page.click(config.auth.submitSelector, {
          timeout: 5000,
        });
        logger.debug('登录按钮已点击');
      }

      // 等待登录完成
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      logger.info('表单登录完成');
    } catch (error) {
      logger.error('表单登录失败:', error);
      throw error;
    }
  }

  /**
   * 加载 storage-state
   */
  private async loadStorageState(page: Page, config: SurfaceConfig): Promise<void> {
    logger.info('加载 storage-state...');

    try {
      if (!config.auth.storageStatePath) {
        throw new Error('storageStatePath is required for storage-state mode');
      }

      const statePath = config.auth.storageStatePath;
      
      // 检查文件是否存在
      if (!await fileExists(statePath)) {
        throw new Error(`Storage state file not found: ${statePath}`);
      }

      // 读取 storage state
      const stateContent = await readFileContent(statePath);
      const state = JSON.parse(stateContent);

      // 加载 cookies
      if (state.cookies) {
        await page.context().addCookies(state.cookies);
        logger.debug(`已加载 ${state.cookies.length} 个 cookies`);
      }

      // 加载 localStorage
      if (state.origins) {
        for (const origin of state.origins) {
          if (origin.localStorage) {
            await page.evaluate((data) => {
              for (const item of data.localStorage) {
                localStorage.setItem(item.name, item.value);
              }
            }, origin);
            logger.debug(`已加载 ${origin.localStorage.length} 个 localStorage 项`);
          }
        }
      }

      logger.info('Storage-state 加载完成');
    } catch (error) {
      logger.error('Storage-state 加载失败:', error);
      throw error;
    }
  }
}
