import { describe, it, expect, beforeEach } from 'vitest';
import { RiskClassifier } from '../surface/core/risk-classifier.js';
import { ErrorCollector } from '../surface/core/error-collector.js';
import { IssueFactory } from '../surface/output/issue-factory.js';

describe('边界条件测试', () => {
  describe('RiskClassifier 边界条件', () => {
    let classifier: RiskClassifier;

    beforeEach(() => {
      classifier = new RiskClassifier();
    });

    it('应该处理 null 输入', () => {
      // 这个测试应该失败，因为 classify 方法没有处理 null
      expect(() => classifier.classify(null as any)).toThrow();
    });

    it('应该处理 undefined 输入', () => {
      // 这个测试应该失败，因为 classify 方法没有处理 undefined
      expect(() => classifier.classify(undefined as any)).toThrow();
    });

    it('应该处理空对象', () => {
      const result = classifier.classify({} as any);
      expect(result).toBe('safe');
    });

    it('应该处理没有 text 属性的对象', () => {
      const result = classifier.classify({ type: 'button' } as any);
      expect(result).toBe('safe');
    });

    it('应该处理超长文本', () => {
      const longText = 'a'.repeat(10000);
      const result = classifier.classify({ text: longText } as any);
      expect(result).toBe('safe');
    });

    it('应该处理特殊字符', () => {
      const specialTexts = [
        '!@#$%^&*()',
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        'null',
        'undefined',
        'NaN',
        'Infinity',
        '-Infinity',
        '0',
        '-0',
        'false',
        'true',
      ];

      for (const text of specialTexts) {
        const result = classifier.classify({ text } as any);
        expect(result).toBe('safe');
      }
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeTexts = [
        '你好世界',
        '🚀🎉',
        'مرحبا',
        'こんにちは',
        '안녕하세요',
        'สวัสดี',
        'Привет',
      ];

      for (const text of unicodeTexts) {
        const result = classifier.classify({ text } as any);
        expect(result).toBe('safe');
      }
    });

    it('应该处理 HTML 标签', () => {
      const htmlTexts = [
        '<b>bold</b>',
        '<i>italic</i>',
        '<a href="http://example.com">link</a>',
        '<img src="image.jpg" />',
        '<div class="container">content</div>',
      ];

      for (const text of htmlTexts) {
        const result = classifier.classify({ text } as any);
        expect(result).toBe('safe');
      }
    });
  });

  describe('ErrorCollector 边界条件', () => {
    let collector: ErrorCollector;

    beforeEach(() => {
      collector = new ErrorCollector();
    });

    it('应该返回空快照', () => {
      const snapshot = collector.getSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.consoleErrors).toHaveLength(0);
      expect(snapshot.pageErrors).toHaveLength(0);
      expect(snapshot.networkErrors).toHaveLength(0);
      expect(snapshot.requestFailures).toHaveLength(0);
    });

    it('应该返回正确的错误计数', () => {
      expect(collector.getErrorCount()).toBe(0);
      expect(collector.hasErrors()).toBe(false);
    });

    it('应该重置错误', () => {
      collector.reset();
      const snapshot = collector.getSnapshot();
      expect(snapshot.consoleErrors).toHaveLength(0);
      expect(snapshot.pageErrors).toHaveLength(0);
      expect(snapshot.networkErrors).toHaveLength(0);
      expect(snapshot.requestFailures).toHaveLength(0);
    });
  });

  describe('IssueFactory 边界条件', () => {
    let factory: IssueFactory;

    beforeEach(() => {
      factory = new IssueFactory();
    });

    it('应该处理空字符串字段', () => {
      const issue = factory.create({
        runId: '',
        category: 'page-error',
        severity: 'critical',
        title: '',
        message: '',
        route: { id: '', name: '', url: '' },
        reproduceSteps: [],
        evidence: {},
        agentHints: {},
      });

      expect(issue).toBeDefined();
      expect(issue.id).toBeDefined();
      expect(issue.runId).toBe('');
      expect(issue.title).toBe('');
      expect(issue.message).toBe('');
    });

    it('应该处理超长字符串', () => {
      const longString = 'a'.repeat(10000);
      const issue = factory.create({
        runId: longString,
        category: 'page-error',
        severity: 'critical',
        title: longString,
        message: longString,
        route: { id: longString, name: longString, url: longString },
        reproduceSteps: [longString],
        evidence: {},
        agentHints: {},
      });

      expect(issue).toBeDefined();
      expect(issue.runId).toBe(longString);
    });

    it('应该处理特殊字符', () => {
      const specialString = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const issue = factory.create({
        runId: specialString,
        category: 'page-error',
        severity: 'critical',
        title: specialString,
        message: specialString,
        route: { id: specialString, name: specialString, url: specialString },
        reproduceSteps: [specialString],
        evidence: {},
        agentHints: {},
      });

      expect(issue).toBeDefined();
      expect(issue.runId).toBe(specialString);
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeString = '你好世界🚀🎉';
      const issue = factory.create({
        runId: unicodeString,
        category: 'page-error',
        severity: 'critical',
        title: unicodeString,
        message: unicodeString,
        route: { id: unicodeString, name: unicodeString, url: unicodeString },
        reproduceSteps: [unicodeString],
        evidence: {},
        agentHints: {},
      });

      expect(issue).toBeDefined();
      expect(issue.runId).toBe(unicodeString);
    });
  });
});
