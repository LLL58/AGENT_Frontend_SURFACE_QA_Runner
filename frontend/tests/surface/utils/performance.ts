import { logger } from './logger.js';

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * 开始计时
   */
  start(name: string): void {
    this.metrics.set(name, {
      startTime: Date.now(),
    });
    logger.debug(`性能监控开始: ${name}`);
  }

  /**
   * 结束计时
   */
  end(name: string): PerformanceMetrics | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`性能监控未找到: ${name}`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.memoryUsage = process.memoryUsage();

    logger.debug(`性能监控结束: ${name} - ${metric.duration}ms`);
    return metric;
  }

  /**
   * 获取指标
   */
  getMetrics(name: string): PerformanceMetrics | null {
    return this.metrics.get(name) || null;
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * 重置
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    let report = '性能监控报告\n';
    report += '=' .repeat(50) + '\n\n';

    for (const [name, metric] of this.metrics) {
      report += `${name}:\n`;
      report += `  开始时间: ${new Date(metric.startTime).toISOString()}\n`;
      
      if (metric.endTime) {
        report += `  结束时间: ${new Date(metric.endTime).toISOString()}\n`;
        report += `  耗时: ${metric.duration}ms\n`;
      }
      
      if (metric.memoryUsage) {
        report += `  内存使用: ${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB\n`;
      }
      
      report += '\n';
    }

    return report;
  }
}

/**
 * 默认性能监控器实例
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * 性能装饰器
 */
export function measure(name: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.start(name);
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        performanceMonitor.end(name);
      }
    };

    return descriptor;
  };
}
