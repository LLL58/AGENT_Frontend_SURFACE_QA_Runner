import { createHash } from 'crypto';

/**
 * 计算内容的 MD5 哈希值
 * @param content 要哈希的内容
 * @returns 哈希值（十六进制字符串）
 */
export function hashContent(content: string): string {
  return createHash('md5').update(content).digest('hex');
}
