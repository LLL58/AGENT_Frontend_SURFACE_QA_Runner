import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig } from '../surface/core/config-loader';

describe('ConfigLoader', () => {
  beforeEach(() => {
    // 清除环境变量
    delete process.env.E2E_BASE_URL;
    delete process.env.SURFACE_BROWSER;
    delete process.env.SURFACE_HEADLESS;
    delete process.env.E2E_USERNAME;
    delete process.env.E2E_PASSWORD;
  });

  it('should load default config', async () => {
    const config = await loadConfig();
    
    expect(config).toBeDefined();
    expect(config.baseUrl).toBeDefined();
    expect(config.browser.name).toBe('chromium');
    expect(config.browser.headless).toBeDefined();
    expect(config.auth.mode).toBeDefined();
  });

  it('should override config with environment variables', async () => {
    process.env.E2E_BASE_URL = 'http://example.com:8080';
    process.env.SURFACE_BROWSER = 'firefox';
    process.env.SURFACE_HEADLESS = 'false';

    const config = await loadConfig();
    
    expect(config.baseUrl).toBe('http://example.com:8080');
    expect(config.browser.name).toBe('firefox');
    expect(config.browser.headless).toBe(false);
  });

  it('should validate baseUrl protocol', async () => {
    process.env.E2E_BASE_URL = 'ftp://invalid.com';

    await expect(loadConfig()).rejects.toThrow('baseUrl must start with http:// or https://');
  });

  it('should accept login-form mode with credentials', async () => {
    process.env.E2E_AUTH_MODE = 'login-form';
    process.env.E2E_USERNAME = 'test@example.com';
    process.env.E2E_PASSWORD = 'password123';

    const config = await loadConfig();
    
    expect(config.auth.mode).toBe('login-form');
    expect(config.auth.username).toBe('test@example.com');
    expect(config.auth.password).toBe('password123');
  });

  it('should accept valid login-form config', async () => {
    process.env.E2E_AUTH_MODE = 'login-form';
    process.env.E2E_USERNAME = 'test@example.com';
    process.env.E2E_PASSWORD = 'password123';

    const config = await loadConfig();
    
    expect(config.auth.mode).toBe('login-form');
    expect(config.auth.username).toBe('test@example.com');
    expect(config.auth.password).toBe('password123');
  });
});
