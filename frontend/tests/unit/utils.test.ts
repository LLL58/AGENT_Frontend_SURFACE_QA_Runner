import { describe, it, expect } from 'vitest';
import { hashContent } from '../surface/utils/hash';

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
});
