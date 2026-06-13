import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Full Flow E2E', () => {
  it('should have correct project structure', () => {
    const baseDir = join(__dirname, '..');
    
    // 验证核心目录存在
    expect(existsSync(join(baseDir, 'surface'))).toBe(true);
    expect(existsSync(join(baseDir, 'surface', 'config'))).toBe(true);
    expect(existsSync(join(baseDir, 'surface', 'core'))).toBe(true);
    expect(existsSync(join(baseDir, 'surface', 'output'))).toBe(true);
    expect(existsSync(join(baseDir, 'surface', 'utils'))).toBe(true);
  });

  it('should have all required source files', () => {
    const baseDir = join(__dirname, '..', 'surface');
    
    // 验证核心文件存在
    const requiredFiles = [
      'config/surface.config.ts',
      'config/routes.ts',
      'core/types.ts',
      'core/config-loader.ts',
      'core/browser-session.ts',
      'core/error-collector.ts',
      'core/page-health-checker.ts',
      'core/control-scanner.ts',
      'core/risk-classifier.ts',
      'core/action-executor.ts',
      'core/result-checker.ts',
      'core/route-runner.ts',
      'output/issue-factory.ts',
      'output/json-writer.ts',
      'output/artifact-writer.ts',
      'output/feedback-sink.ts',
      'utils/hash.ts',
      'utils/sleep.ts',
      'utils/file.ts',
    ];

    for (const file of requiredFiles) {
      expect(existsSync(join(baseDir, file))).toBe(true);
    }
  });

  it('should have entry point file', () => {
    const entryFile = join(__dirname, '..', 'surface', 'run-agent-surface-check.ts');
    expect(existsSync(entryFile)).toBe(true);
  });

  it('should have test fixtures', () => {
    const fixturesDir = join(__dirname, '..', 'fixtures');
    expect(existsSync(fixturesDir)).toBe(true);
    expect(existsSync(join(fixturesDir, 'test-page.html'))).toBe(true);
    expect(existsSync(join(fixturesDir, 'test-page-with-errors.html'))).toBe(true);
  });
});
