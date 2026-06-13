import { describe, it, expect } from 'vitest';
import { defaultConfig } from '../surface/config/surface.config.js';

describe('SurfaceConfig', () => {
  it('should export default config object', () => {
    expect(defaultConfig).toBeDefined();
    expect(typeof defaultConfig).toBe('object');
  });

  it('should have all required config fields', () => {
    expect(defaultConfig.baseUrl).toBeDefined();
    expect(defaultConfig.outputDir).toBeDefined();
    expect(defaultConfig.browser).toBeDefined();
    expect(defaultConfig.auth).toBeDefined();
    expect(defaultConfig.scan).toBeDefined();
    expect(defaultConfig.ignore).toBeDefined();
  });

  it('should have reasonable default values', () => {
    expect(defaultConfig.baseUrl).toBe('http://localhost:3000');
    expect(defaultConfig.outputDir).toBe('.agent-feedback');
    expect(defaultConfig.browser.name).toBe('chromium');
    expect(defaultConfig.browser.headless).toBe(true);
    expect(defaultConfig.browser.timeout).toBeGreaterThan(0);
    expect(defaultConfig.auth.mode).toBe('none');
    expect(defaultConfig.scan.maxRoutes).toBeGreaterThan(0);
    expect(defaultConfig.scan.maxControls).toBeGreaterThan(0);
    expect(defaultConfig.scan.actionTimeout).toBeGreaterThan(0);
  });
});
