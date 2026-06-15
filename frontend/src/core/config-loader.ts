import { config as loadDotenv } from 'dotenv';
import { resolve } from 'path';
import type { SurfaceConfig } from './types.js';
import { defaultConfig } from '../config/surface.config.js';

/**
 * 加载配置
 * 优先级：环境变量 > 默认配置
 */
export async function loadConfig(): Promise<SurfaceConfig> {
  // 加载 .env 文件
  loadDotenv({ path: resolve(process.cwd(), '.env') });

  // 合并配置
  const surfaceConfig: SurfaceConfig = {
    baseUrl: process.env.E2E_BASE_URL || defaultConfig.baseUrl,
    outputDir: process.env.AGENT_FEEDBACK_DIR || defaultConfig.outputDir,
    browser: {
      name: (process.env.SURFACE_BROWSER as SurfaceConfig['browser']['name']) || defaultConfig.browser.name,
      headless: process.env.SURFACE_HEADLESS !== 'false',
      timeout: parseInt(process.env.SURFACE_PAGE_TIMEOUT || '') || defaultConfig.browser.timeout,
      viewport: {
        width: parseInt(process.env.SURFACE_VIEWPORT_WIDTH || '') || defaultConfig.browser.viewport.width,
        height: parseInt(process.env.SURFACE_VIEWPORT_HEIGHT || '') || defaultConfig.browser.viewport.height,
      },
    },
    auth: {
      mode: (process.env.E2E_AUTH_MODE as SurfaceConfig['auth']['mode']) || defaultConfig.auth.mode,
      loginUrl: process.env.E2E_LOGIN_URL || defaultConfig.auth.loginUrl,
      username: process.env.E2E_USERNAME || defaultConfig.auth.username,
      password: process.env.E2E_PASSWORD || defaultConfig.auth.password,
      usernameSelector: defaultConfig.auth.usernameSelector,
      passwordSelector: defaultConfig.auth.passwordSelector,
      submitSelector: defaultConfig.auth.submitSelector,
      storageStatePath: process.env.E2E_STORAGE_STATE || defaultConfig.auth.storageStatePath,
    },
    scan: {
      maxRoutes: parseInt(process.env.SURFACE_MAX_ROUTES || '') || defaultConfig.scan.maxRoutes,
      maxControls: parseInt(process.env.SURFACE_MAX_CONTROLS || '') || defaultConfig.scan.maxControls,
      actionTimeout: parseInt(process.env.SURFACE_ACTION_TIMEOUT || '') || defaultConfig.scan.actionTimeout,
      afterActionWaitMs: defaultConfig.scan.afterActionWaitMs,
    },
    ignore: defaultConfig.ignore,
    effectCheck: defaultConfig.effectCheck,
    report: defaultConfig.report,
  };

  // 验证配置
  validateConfig(surfaceConfig);

  return surfaceConfig;
}

/**
 * 验证配置
 */
function validateConfig(config: SurfaceConfig): void {
  if (!config.baseUrl) {
    throw new Error('baseUrl is required');
  }

  if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
    throw new Error('baseUrl must start with http:// or https://');
  }

  if (config.auth.mode === 'login-form') {
    if (!config.auth.username || !config.auth.password) {
      throw new Error('username and password are required for login-form mode');
    }
  }
}
