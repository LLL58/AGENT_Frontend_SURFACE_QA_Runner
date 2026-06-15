import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouteRunner } from '../surface/core/route-runner.js';
import type { SurfaceConfig, SurfaceRoute } from '../surface/core/types.js';
import { defaultConfig } from '../surface/config/surface.config.js';

// Mock 所有依赖
vi.mock('../surface/core/browser-session.js', () => ({
  BrowserSession: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue({
      goto: vi.fn(),
      waitForLoadState: vi.fn(),
      waitForTimeout: vi.fn(),
      url: vi.fn().mockReturnValue('http://localhost:3000'),
      evaluate: vi.fn().mockResolvedValue(''),
      content: vi.fn().mockResolvedValue('<html></html>'),
      screenshot: vi.fn(),
    }),
    stop: vi.fn(),
    getPage: vi.fn(),
  })),
}));

vi.mock('../surface/core/error-collector.js', () => ({
  ErrorCollector: vi.fn().mockImplementation(() => ({
    attach: vi.fn(),
    reset: vi.fn(),
    getSnapshot: vi.fn().mockReturnValue({
      consoleErrors: [],
      pageErrors: [],
      networkErrors: [],
      requestFailures: [],
    }),
    hasErrors: vi.fn().mockReturnValue(false),
  })),
}));

vi.mock('../surface/core/page-health-checker.js', () => ({
  PageHealthChecker: vi.fn().mockImplementation(() => ({
    check: vi.fn().mockResolvedValue({ ok: true, issues: [] }),
  })),
}));

vi.mock('../surface/core/control-scanner.js', () => ({
  ControlScanner: vi.fn().mockImplementation(() => ({
    scan: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../surface/core/risk-classifier.js', () => ({
  RiskClassifier: vi.fn().mockImplementation(() => ({
    classify: vi.fn().mockReturnValue('safe'),
    shouldExecute: vi.fn().mockReturnValue(true),
  })),
}));

vi.mock('../surface/core/action-executor.js', () => ({
  ActionExecutor: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
  })),
}));

vi.mock('../surface/core/result-checker.js', () => ({
  ResultChecker: vi.fn().mockImplementation(() => ({
    checkAfterAction: vi.fn().mockResolvedValue({
      success: true,
      issues: [],
      beforeUrl: 'http://localhost:3000',
      afterUrl: 'http://localhost:3000',
      urlChanged: false,
      hasErrors: false,
      hasObservableEffect: true,
    }),
  })),
}));

describe('RouteRunner', () => {
  let runner: RouteRunner;
  let config: SurfaceConfig;

  beforeEach(() => {
    config = { ...defaultConfig };
    runner = new RouteRunner(config);
  });

  it('should create RouteRunner instance', () => {
    expect(runner).toBeDefined();
  });

  it('should run with empty routes', async () => {
    const result = await runner.run([]);
    expect(result.summary).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(result.summary.totalRoutes).toBe(0);
  });

  it('should run with single route', async () => {
    const routes: SurfaceRoute[] = [
      { id: 'test', name: 'Test', url: '/test' },
    ];

    const result = await runner.run(routes);
    expect(result.summary).toBeDefined();
    expect(result.summary.totalRoutes).toBe(1);
  });

  it('should run with multiple routes', async () => {
    const routes: SurfaceRoute[] = [
      { id: 'home', name: 'Home', url: '/' },
      { id: 'login', name: 'Login', url: '/login' },
      { id: 'dashboard', name: 'Dashboard', url: '/dashboard' },
    ];

    const result = await runner.run(routes);
    expect(result.summary).toBeDefined();
    expect(result.summary.totalRoutes).toBe(3);
  });

  it('should generate unique runId', async () => {
    const routes: SurfaceRoute[] = [];
    
    const result1 = await runner.run(routes);
    // 添加延迟确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 10));
    const result2 = await runner.run(routes);
    
    expect(result1.summary.runId).not.toBe(result2.summary.runId);
  });

  it('should set correct timestamps', async () => {
    const routes: SurfaceRoute[] = [];
    
    const result = await runner.run(routes);
    
    expect(result.summary.startedAt).toBeDefined();
    expect(result.summary.finishedAt).toBeDefined();
    expect(new Date(result.summary.startedAt).getTime()).toBeLessThanOrEqual(
      new Date(result.summary.finishedAt).getTime()
    );
  });
});
