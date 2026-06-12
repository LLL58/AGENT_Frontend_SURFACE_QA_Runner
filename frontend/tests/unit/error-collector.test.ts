import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorCollector } from '../surface/core/error-collector';

describe('ErrorCollector', () => {
  let collector: ErrorCollector;

  beforeEach(() => {
    collector = new ErrorCollector();
  });

  it('should initialize with empty errors', () => {
    const snapshot = collector.getSnapshot();
    
    expect(snapshot.consoleErrors).toEqual([]);
    expect(snapshot.pageErrors).toEqual([]);
    expect(snapshot.networkErrors).toEqual([]);
    expect(snapshot.requestFailures).toEqual([]);
  });

  it('should report no errors initially', () => {
    expect(collector.hasErrors()).toBe(false);
    expect(collector.getErrorCount()).toBe(0);
  });

  it('should reset errors', () => {
    // 模拟一些错误
    collector.reset();
    
    expect(collector.hasErrors()).toBe(false);
    expect(collector.getErrorCount()).toBe(0);
  });

  it('should return a copy of snapshot', () => {
    const snapshot1 = collector.getSnapshot();
    const snapshot2 = collector.getSnapshot();
    
    // 应该是不同的对象引用
    expect(snapshot1).not.toBe(snapshot2);
    // 但内容应该相同
    expect(snapshot1).toEqual(snapshot2);
  });
});
