import { describe, it, expect, vi } from 'vitest';
import { hashContent } from '../surface/utils/hash';
import { sleep } from '../surface/utils/sleep';
import { fileExists, ensureDir, writeFileEnsured } from '../surface/utils/file';

describe('Utils', () => {
  describe('hashContent', () => {
    it('should generate consistent hash', () => {
      const content = 'test content';
      const hash1 = hashContent(content);
      const hash2 = hashContent(content);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different content', () => {
      const hash1 = hashContent('content 1');
      const hash2 = hashContent('content 2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 32 character hex string', () => {
      const hash = hashContent('test');
      
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should handle empty string', () => {
      const hash = hashContent('');
      
      expect(hash).toHaveLength(32);
    });

    it('should handle unicode content', () => {
      const hash = hashContent('你好世界');
      
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('sleep', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      // 允许小误差（±20ms）
      expect(elapsed).toBeGreaterThanOrEqual(80);
      expect(elapsed).toBeLessThan(200);
    });

    it('should resolve with void', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('file utils', () => {
    it('fileExists should return true for existing file', async () => {
      // 测试当前文件（测试文件本身应该存在）
      const exists = await fileExists(import.meta.url.replace('file:///', ''));
      expect(exists).toBe(true);
    });

    it('fileExists should return false for non-existing file', async () => {
      const exists = await fileExists('/non/existing/file.txt');
      expect(exists).toBe(false);
    });
  });
});
