import { config as loadDotenv } from 'dotenv';
import { resolve } from 'path';
import type { SurfaceConfig } from './types.js';
import { defaultConfig } from '../config/surface.config.js';
import { logger } from '../utils/logger.js';
import { fileExists } from '../utils/file.js';

/**
 * 加载配置
 * 优先级：环境变量 > 配置文件 > 默认配置
 */
export async function loadConfig(): Promise<SurfaceConfig> {
  // 加载 .env 文件
  loadDotenv({ path: resolve(process.cwd(), '.env') });

  // 尝试加载配置文件
  let fileConfig: Partial<SurfaceConfig> = {};
  try {
    fileConfig = await loadConfigFile();
  } catch (error) {
    logger.debug('加载配置文件失败，使用默认配置:', error);
  }

  // 合并配置
  const surfaceConfig: SurfaceConfig = {
    baseUrl: process.env.E2E_BASE_URL || fileConfig.baseUrl || defaultConfig.baseUrl,
    outputDir: process.env.AGENT_FEEDBACK_DIR || fileConfig.outputDir || defaultConfig.outputDir,
    browser: {
      name: (process.env.SURFACE_BROWSER as SurfaceConfig['browser']['name']) || fileConfig.browser?.name || defaultConfig.browser.name,
      headless: process.env.SURFACE_HEADLESS !== 'false' && (fileConfig.browser?.headless ?? defaultConfig.browser.headless),
      timeout: parseInt(process.env.SURFACE_PAGE_TIMEOUT || '') || fileConfig.browser?.timeout || defaultConfig.browser.timeout,
      viewport: {
        width: parseInt(process.env.SURFACE_VIEWPORT_WIDTH || '') || fileConfig.browser?.viewport?.width || defaultConfig.browser.viewport.width,
        height: parseInt(process.env.SURFACE_VIEWPORT_HEIGHT || '') || fileConfig.browser?.viewport?.height || defaultConfig.browser.viewport.height,
      },
    },
    auth: {
      mode: (process.env.E2E_AUTH_MODE as SurfaceConfig['auth']['mode']) || fileConfig.auth?.mode || defaultConfig.auth.mode,
      loginUrl: process.env.E2E_LOGIN_URL || fileConfig.auth?.loginUrl || defaultConfig.auth.loginUrl,
      username: process.env.E2E_USERNAME || fileConfig.auth?.username || defaultConfig.auth.username,
      password: process.env.E2E_PASSWORD || fileConfig.auth?.password || defaultConfig.auth.password,
      usernameSelector: fileConfig.auth?.usernameSelector || defaultConfig.auth.usernameSelector,
      passwordSelector: fileConfig.auth?.passwordSelector || defaultConfig.auth.passwordSelector,
      submitSelector: fileConfig.auth?.submitSelector || defaultConfig.auth.submitSelector,
      storageStatePath: process.env.E2E_STORAGE_STATE || fileConfig.auth?.storageStatePath || defaultConfig.auth.storageStatePath,
    },
    scan: {
      maxRoutes: parseInt(process.env.SURFACE_MAX_ROUTES || '') || fileConfig.scan?.maxRoutes || defaultConfig.scan.maxRoutes,
      maxControls: parseInt(process.env.SURFACE_MAX_CONTROLS || '') || fileConfig.scan?.maxControls || defaultConfig.scan.maxControls,
      actionTimeout: parseInt(process.env.SURFACE_ACTION_TIMEOUT || '') || fileConfig.scan?.actionTimeout || defaultConfig.scan.actionTimeout,
      afterActionWaitMs: fileConfig.scan?.afterActionWaitMs || defaultConfig.scan.afterActionWaitMs,
    },
    ignore: fileConfig.ignore || defaultConfig.ignore,
    effectCheck: fileConfig.effectCheck || defaultConfig.effectCheck,
    report: fileConfig.report || defaultConfig.report,
  };

  // 验证配置
  validateConfig(surfaceConfig);

  return surfaceConfig;
}

/**
 * 加载配置文件
 */
async function loadConfigFile(): Promise<Partial<SurfaceConfig>> {
  const configPath = resolve(process.cwd(), 'surface.config.ts');
  
  if (!await fileExists(configPath)) {
    logger.debug('配置文件不存在:', configPath);
    return {};
  }

  try {
    // 动态导入配置文件
    const config = await import(configPath);
    logger.info('已加载配置文件:', configPath);
    return config.default || config;
  } catch (error) {
    logger.warn('加载配置文件失败:', error);
    return {};
  }
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

  if (config.auth.mode === 'storage-state') {
    if (!config.auth.storageStatePath) {
      throw new Error('storageStatePath is required for storage-state mode');
    }
  }
}
