import { describe, it, expect } from 'vitest';

// 风险分类逻辑
function classifyRisk(text: string): 'safe' | 'warning' | 'danger' {
  const lowerText = text.toLowerCase();

  const dangerWords = [
    '删除', 'delete', '移除', 'remove',
    '支付', 'pay', '退款', 'refund',
    '注销', '退出', 'logout', 'signout',
  ];

  const warningWords = [
    '保存', 'save', '提交', 'submit',
    '创建', 'create', '发布', 'publish',
    '更新', 'update', '修改', 'edit',
  ];

  if (dangerWords.some(word => lowerText.includes(word))) {
    return 'danger';
  }

  if (warningWords.some(word => lowerText.includes(word))) {
    return 'warning';
  }

  return 'safe';
}

describe('RiskClassifier', () => {
  it('should classify safe actions', () => {
    expect(classifyRisk('查看详情')).toBe('safe');
    expect(classifyRisk('打开菜单')).toBe('safe');
    expect(classifyRisk('切换标签')).toBe('safe');
    expect(classifyRisk('搜索')).toBe('safe');
  });

  it('should classify warning actions', () => {
    expect(classifyRisk('保存')).toBe('warning');
    expect(classifyRisk('提交表单')).toBe('warning');
    expect(classifyRisk('创建新项目')).toBe('warning');
    expect(classifyRisk('发布文章')).toBe('warning');
    expect(classifyRisk('更新资料')).toBe('warning');
  });

  it('should classify danger actions', () => {
    expect(classifyRisk('删除')).toBe('danger');
    expect(classifyRisk('支付订单')).toBe('danger');
    expect(classifyRisk('退款')).toBe('danger');
    expect(classifyRisk('注销账号')).toBe('danger');
    expect(classifyRisk('退出登录')).toBe('danger');
  });

  it('should be case insensitive', () => {
    expect(classifyRisk('DELETE')).toBe('danger');
    expect(classifyRisk('Save')).toBe('warning');
    expect(classifyRisk('SUBMIT')).toBe('warning');
  });

  it('should handle mixed text', () => {
    expect(classifyRisk('确认删除')).toBe('danger');
    expect(classifyRisk('保存并提交')).toBe('warning');
    expect(classifyRisk('查看详情')).toBe('safe');
  });
});
