import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { dirname } from 'path';
import { logger } from './logger.js';

/**
 * 确保目录存在
 * @param dirPath 目录路径
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
    logger.debug(`目录已创建: ${dirPath}`);
  } catch (error) {
    logger.error(`创建目录失败: ${dirPath}`, error);
    throw error;
  }
}

/**
 * 写入文件（自动创建目录）
 * @param filePath 文件路径
 * @param content 文件内容
 */
export async function writeFileEnsured(filePath: string, content: string): Promise<void> {
  try {
    await ensureDir(dirname(filePath));
    await writeFile(filePath, content, 'utf-8');
    logger.debug(`文件已写入: ${filePath}`);
  } catch (error) {
    logger.error(`写入文件失败: ${filePath}`, error);
    throw error;
  }
}

/**
 * 读取文件
 * @param filePath 文件路径
 * @returns 文件内容
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    logger.debug(`文件已读取: ${filePath}`);
    return content;
  } catch (error) {
    logger.error(`读取文件失败: ${filePath}`, error);
    throw error;
  }
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
