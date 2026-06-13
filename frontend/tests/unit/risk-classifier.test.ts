import { describe, it, expect, beforeEach } from 'vitest';
import { RiskClassifier } from '../surface/core/risk-classifier.js';

describe('RiskClassifier', () => {
  let classifier: RiskClassifier;

  beforeEach(() => {
    classifier = new RiskClassifier();
  });

  describe('基础分类', () => {
    it('应该分类安全动作', () => {
      expect(classifier.classify({ text: '查看详情' } as any)).toBe('safe');
      expect(classifier.classify({ text: '打开菜单' } as any)).toBe('safe');
      expect(classifier.classify({ text: '切换标签' } as any)).toBe('safe');
      expect(classifier.classify({ text: '搜索' } as any)).toBe('safe');
    });

    it('应该分类警告动作', () => {
      expect(classifier.classify({ text: '保存' } as any)).toBe('warning');
      expect(classifier.classify({ text: '提交表单' } as any)).toBe('warning');
      expect(classifier.classify({ text: '创建新项目' } as any)).toBe('warning');
      expect(classifier.classify({ text: '发布文章' } as any)).toBe('warning');
      expect(classifier.classify({ text: '更新资料' } as any)).toBe('warning');
    });

    it('应该分类危险动作', () => {
      expect(classifier.classify({ text: '删除' } as any)).toBe('danger');
      expect(classifier.classify({ text: '支付订单' } as any)).toBe('danger');
      expect(classifier.classify({ text: '退款' } as any)).toBe('danger');
      expect(classifier.classify({ text: '注销账号' } as any)).toBe('danger');
      expect(classifier.classify({ text: '退出登录' } as any)).toBe('danger');
    });

    it('应该不区分大小写', () => {
      expect(classifier.classify({ text: 'DELETE' } as any)).toBe('danger');
      expect(classifier.classify({ text: 'Save' } as any)).toBe('warning');
      expect(classifier.classify({ text: 'SUBMIT' } as any)).toBe('warning');
    });

    it('应该处理混合文本', () => {
      expect(classifier.classify({ text: '确认删除' } as any)).toBe('danger');
      expect(classifier.classify({ text: '保存并提交' } as any)).toBe('warning');
      expect(classifier.classify({ text: '查看详情' } as any)).toBe('safe');
    });
  });

  describe('边界条件', () => {
    it('应该处理空文本', () => {
      expect(classifier.classify({ text: '' } as any)).toBe('safe');
    });

    it('应该处理只有空格的文本', () => {
      expect(classifier.classify({ text: '   ' } as any)).toBe('safe');
    });

    it('应该处理超长文本', () => {
      const longText = 'a'.repeat(10000);
      expect(classifier.classify({ text: longText } as any)).toBe('safe');
    });

    it('应该处理特殊字符', () => {
      expect(classifier.classify({ text: '!@#$%^&*()' } as any)).toBe('safe');
      expect(classifier.classify({ text: '<script>alert("xss")</script>' } as any)).toBe('safe');
    });

    it('应该处理 Unicode 字符', () => {
      expect(classifier.classify({ text: '你好世界' } as any)).toBe('safe');
      expect(classifier.classify({ text: '🚀🎉' } as any)).toBe('safe');
    });
  });

  describe('shouldExecute 方法', () => {
    it('应该执行安全控件', () => {
      expect(classifier.shouldExecute({ text: '查看详情' } as any)).toBe(true);
    });

    it('应该不执行警告控件（默认）', () => {
      expect(classifier.shouldExecute({ text: '保存' } as any)).toBe(false);
    });

    it('应该执行警告控件（允许警告）', () => {
      expect(classifier.shouldExecute({ text: '保存' } as any, true)).toBe(true);
    });

    it('应该不执行危险控件', () => {
      expect(classifier.shouldExecute({ text: '删除' } as any)).toBe(false);
      expect(classifier.shouldExecute({ text: '删除' } as any, true)).toBe(false);
    });
  });

  describe('性能测试', () => {
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
  });
});
