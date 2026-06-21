#!/usr/bin/env node

/**
 * ACP (Agent Client Protocol) 入口文件
 * 用于编辑器集成
 */

import { AcpHandler } from './handler.js';

async function main() {
  const handler = new AcpHandler();
  await handler.start();
}

main().catch(error => {
  process.stderr.write(`ACP 启动失败: ${error}\n`);
  process.exit(1);
});
