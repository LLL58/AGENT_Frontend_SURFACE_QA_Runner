/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志配置
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
}

/**
 * 日志工具
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(config: LoggerConfig) {
    this.level = config.level;
    this.prefix = config.prefix || '';
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('DEBUG', message), ...args);
    }
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.format('INFO', message), ...args);
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('WARN', message), ...args);
    }
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.format('ERROR', message), ...args);
    }
  }

  /**
   * 判断是否应该记录日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 格式化日志消息
   */
  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `[${timestamp}] [${level}]${prefix} ${message}`;
  }
}

/**
 * 默认日志实例
 */
export const logger = new Logger({ level: 'info', prefix: 'SurfaceQA' });
