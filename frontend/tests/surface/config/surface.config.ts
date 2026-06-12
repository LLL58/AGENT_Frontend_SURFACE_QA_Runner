import type { SurfaceConfig } from '../core/types.js';

/**
 * 默认配置
 */
export const defaultConfig: SurfaceConfig = {
  baseUrl: 'http://localhost:3000',
  outputDir: '.agent-feedback',
  browser: {
    name: 'chromium',
    headless: true,
    timeout: 30000,
    viewport: {
      width: 1280,
      height: 720,
    },
  },
  auth: {
    mode: 'none',
    usernameSelector: '[data-testid="username"], #username, input[name="username"]',
    passwordSelector: '[data-testid="password"], #password, input[name="password"]',
    submitSelector: '[data-testid="submit"], button[type="submit"]',
  },
  scan: {
    maxRoutes: 10,
    maxControls: 20,
    actionTimeout: 10000,
    afterActionWaitMs: 2000,
  },
  ignore: {
    consolePatterns: [
      'favicon.ico',
      'DevTools',
      'React DevTools',
    ],
    networkUrlPatterns: [
      'analytics',
      'tracking',
      'telemetry',
    ],
    statusCodes: [304],
  },
};
