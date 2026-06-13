import { describe, it, expect, beforeEach } from 'vitest';
import { RiskClassifier } from '../surface/core/risk-classifier.js';
import { IssueFactory } from '../surface/output/issue-factory.js';
import { hashContent } from '../surface/utils/hash.js';
import { sleep } from '../surface/utils/sleep.js';

describe('性能测试', () => {
  describe('RiskClassifier 性能', () => {
    let classifier: RiskClassifier;

    beforeEach(() => {
      classifier = new RiskClassifier();
    });

    it('应该在 100ms 内分类 1000 个控件', () => {
      const controls = Array.from({ length: 1000 }, (_, i) => ({
        text: `control-${i}`,
        type: 'button',
      }));

      const start = Date.now();
      for (const control of controls) {
        classifier.classify(control as any);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('应该在 1s 内分类 10000 个控件', () => {
      const controls = Array.from({ length: 10000 }, (_, i) => ({
        text: `control-${i}`,
        type: 'button',
      }));

      const start = Date.now();
      for (const control of controls) {
        classifier.classify(control as any);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
    });

    it('应该处理并发分类', async () => {
      const controls = Array.from({ length: 100 }, (_, i) => ({
        text: `control-${i}`,
        type: 'button',
      }));

      const promises = controls.map(control => 
        Promise.resolve(classifier.classify(control as any))
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(100);
      expect(results.every(r => r === 'safe')).toBe(true);
    });
  });

  describe('IssueFactory 性能', () => {
    let factory: IssueFactory;

    beforeEach(() => {
      factory = new IssueFactory();
    });

    it('应该在 100ms 内创建 1000 个 Issue', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        factory.create({
          runId: `run-${i}`,
          category: 'page-error',
          severity: 'critical',
          title: `Error ${i}`,
          message: `Error message ${i}`,
          route: { id: 'test', name: 'Test', url: '/test' },
          reproduceSteps: ['Step 1'],
          evidence: {},
          agentHints: {},
        });
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('应该生成唯一的 ID', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const issue = factory.create({
          runId: `run-${i}`,
          category: 'page-error',
          severity: 'critical',
          title: `Error ${i}`,
          message: `Error message ${i}`,
          route: { id: 'test', name: 'Test', url: '/test' },
          reproduceSteps: ['Step 1'],
          evidence: {},
          agentHints: {},
        });
        ids.add(issue.id);
      }

      expect(ids.size).toBe(1000);
    });
  });

  describe('Hash 性能', () => {
    it('应该在 10ms 内哈希 1000 个字符串', () => {
      const strings = Array.from({ length: 1000 }, (_, i) => `string-${i}`);

      const start = Date.now();
      for (const str of strings) {
        hashContent(str);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it('应该在 100ms 内哈希 10000 个字符串', () => {
      const strings = Array.from({ length: 10000 }, (_, i) => `string-${i}`);

      const start = Date.now();
      for (const str of strings) {
        hashContent(str);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('应该处理大字符串', () => {
      const largeString = 'a'.repeat(1000000); // 1MB

      const start = Date.now();
      hashContent(largeString);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Sleep 性能', () => {
    it('应该精确延迟', async () => {
      const delays = [10, 50, 100, 200];

      for (const delay of delays) {
        const start = Date.now();
        await sleep(delay);
        const elapsed = Date.now() - start;

        // 允许 ±20ms 误差
        expect(elapsed).toBeGreaterThanOrEqual(delay - 20);
        expect(elapsed).toBeLessThanOrEqual(delay + 20);
      }
    });

    it('应该处理零延迟', async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;

      // 放宽阈值，因为 JavaScript 有最小延迟（通常 4-16ms）
      expect(elapsed).toBeLessThan(20);
    });
  });

  describe('内存性能', () => {
    it('应该在内存限制内运行', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 执行大量操作
      const classifier = new RiskClassifier();
      for (let i = 0; i < 10000; i++) {
        classifier.classify({ text: `control-${i}` } as any);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该小于 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('应该正确释放资源', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 创建大量对象
      const objects = [];
      for (let i = 0; i < 10000; i++) {
        objects.push({ data: 'x'.repeat(100) });
      }
      
      // 清空数组
      objects.length = 0;
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该小于 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
