/**
 * ACP (Agent Client Protocol) 处理器
 * 实现 JSON-RPC 协议，支持编辑器集成
 */

import { createInterface, type Interface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// ACP 协议版本
const ACP_PROTOCOL_VERSION = '1.0.0';

// JSON-RPC 请求接口
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

// JSON-RPC 响应接口
interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: JsonRpcError;
}

// JSON-RPC 错误接口
interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// 工具定义
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * ACP 处理器
 */
export class AcpHandler {
  private readline: Interface;
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.readline = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    this.registerTools();
  }

  /**
   * 注册可用工具
   */
  private registerTools(): void {
    this.tools.set('surface-qa', {
      name: 'surface-qa',
      description: '运行前端表层 Bug 自动巡检工具，检测页面健康、控件扫描、错误收集等',
      inputSchema: {
        type: 'object',
        properties: {
          baseUrl: {
            type: 'string',
            description: '目标应用地址，如 http://localhost:3000',
          },
          route: {
            type: 'string',
            description: '只检查指定路由，如 login、dashboard',
          },
          healthOnly: {
            type: 'boolean',
            description: '只检查页面健康，不点击控件',
          },
          maxRoutes: {
            type: 'number',
            description: '最大检查路由数，默认 10',
          },
          maxControls: {
            type: 'number',
            description: '每页最大控件数，默认 20',
          },
        },
        required: ['baseUrl'],
      },
    });

    this.tools.set('surface-qa-health', {
      name: 'surface-qa-health',
      description: '快速健康检查，只检查页面是否正常加载',
      inputSchema: {
        type: 'object',
        properties: {
          baseUrl: {
            type: 'string',
            description: '目标应用地址',
          },
        },
        required: ['baseUrl'],
      },
    });
  }

  /**
   * 启动 ACP 处理器
   */
  async start(): Promise<void> {
    // 发送初始化消息
    this.sendLog('ACP 处理器已启动');

    this.readline.on('line', async (line: string) => {
      try {
        const request: JsonRpcRequest = JSON.parse(line);
        const response = await this.handleRequest(request);
        this.sendResponse(response);
      } catch (error) {
        this.sendError(-32700, 'Parse error');
      }
    });

    this.readline.on('close', () => {
      this.sendLog('ACP 处理器已关闭');
      process.exit(0);
    });
  }

  /**
   * 处理请求
   */
  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    this.sendLog(`收到请求: ${request.method}`);

    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'initialized':
        return this.handleInitialized(request);
      case 'tools/list':
        return this.handleToolsList(request);
      case 'tools/call':
        return this.handleToolsCall(request);
      case 'shutdown':
        return this.handleShutdown(request);
      default:
        return this.createErrorResponse(request.id, -32601, `Method not found: ${request.method}`);
    }
  }

  /**
   * 处理初始化请求
   */
  private handleInitialize(request: JsonRpcRequest): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: ACP_PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'surface-qa-agent-runner',
          version: '1.2.0',
        },
      },
    };
  }

  /**
   * 处理初始化完成通知
   */
  private handleInitialized(request: JsonRpcRequest): JsonRpcResponse {
    this.sendLog('客户端初始化完成');
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {},
    };
  }

  /**
   * 处理工具列表请求
   */
  private handleToolsList(request: JsonRpcRequest): JsonRpcResponse {
    const tools = Array.from(this.tools.values());
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools },
    };
  }

  /**
   * 处理工具调用请求
   */
  private async handleToolsCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { name, arguments: args } = request.params;

    this.sendLog(`调用工具: ${name}`);

    try {
      let result: string;

      switch (name) {
        case 'surface-qa':
          result = await this.runSurfaceQA(args);
          break;
        case 'surface-qa-health':
          result = await this.runSurfaceQAHealth(args);
          break;
        default:
          return this.createErrorResponse(request.id, -32601, `Tool not found: ${name}`);
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [{ type: 'text', text: result }],
        },
      };
    } catch (error) {
      return this.createErrorResponse(request.id, -32603, `Tool execution failed: ${error}`);
    }
  }

  /**
   * 处理关闭请求
   */
  private handleShutdown(request: JsonRpcRequest): JsonRpcResponse {
    this.sendLog('收到关闭请求');
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {},
    };
  }

  /**
   * 运行 Surface QA 工具
   */
  private async runSurfaceQA(args: any): Promise<string> {
    const { baseUrl, route, healthOnly, maxRoutes, maxControls } = args;

    // 构建命令
    const cmd = [
      'npx tsx tests/surface/run-agent-surface-check.ts',
      `--baseUrl=${baseUrl}`,
      route ? `--route=${route}` : '',
      healthOnly ? '--health-only' : '',
      maxRoutes ? `--max-routes=${maxRoutes}` : '',
      maxControls ? `--max-controls=${maxControls}` : '',
    ].filter(Boolean).join(' ');

    this.sendLog(`执行命令: ${cmd}`);

    try {
      const { stdout } = await execAsync(cmd, {
        cwd: join(__dirname, '..', '..'),
        timeout: 300000,
      });

      // 解析输出
      const lines = stdout.split('\n');
      let summary = null;
      const issues = [];

      for (const line of lines) {
        try {
          const result = JSON.parse(line);
          if (result.type === 'surface-qa.summary') {
            summary = result;
          } else if (result.type === 'surface-qa.issue') {
            issues.push(result);
          }
        } catch {
          // 忽略非 JSON 输出
        }
      }

      // 格式化结果
      if (summary) {
        return this.formatResult(summary, issues);
      }

      return stdout || 'No output';
    } catch (error) {
      return `Error: ${error}`;
    }
  }

  /**
   * 运行健康检查
   */
  private async runSurfaceQAHealth(args: any): Promise<string> {
    return this.runSurfaceQA({ ...args, healthOnly: true });
  }

  /**
   * 格式化结果
   */
  private formatResult(summary: any, issues: any[]): string {
    const statusIcon = summary.status === 'passed' ? '✅' : 
                       summary.status === 'passed_with_warnings' ? '⚠️' : '❌';
    
    let result = `## 测试结果 ${statusIcon}\n\n`;
    result += `| 指标 | 值 |\n|------|-----|\n`;
    result += `| 状态 | ${summary.status} |\n`;
    result += `| 扫描页面 | ${summary.totalRoutes} |\n`;
    result += `| 扫描控件 | ${summary.totalControls} |\n`;
    result += `| 执行动作 | ${summary.totalActions} |\n`;
    result += `| 发现问题 | ${summary.totalIssues} |\n\n`;

    if (issues.length > 0) {
      result += `### 问题列表\n\n`;
      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🔴' : 
                     issue.severity === 'error' ? '🟠' : 
                     issue.severity === 'warning' ? '🟡' : '🔵';
        result += `- ${icon} **${issue.title}** - ${issue.route}\n`;
        result += `  ${issue.message}\n`;
      }
    }

    return result;
  }

  /**
   * 发送日志消息
   */
  private sendLog(message: string): void {
    process.stderr.write(`[ACP] ${message}\n`);
  }

  /**
   * 发送响应
   */
  private sendResponse(response: JsonRpcResponse): void {
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  /**
   * 发送错误
   */
  private sendError(code: number, message: string): void {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code, message },
    };
    this.sendResponse(response);
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(id: number | string, code: number, message: string): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    };
  }
}
