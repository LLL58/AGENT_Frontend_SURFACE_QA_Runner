import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArtifactWriter } from '../surface/output/artifact-writer.js';

// Mock file utils
vi.mock('../surface/utils/file.js', () => ({
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFileEnsured: vi.fn().mockResolvedValue(undefined),
}));

// Mock Page 对象
const mockPage = {
  screenshot: vi.fn().mockResolvedValue(Buffer.from('screenshot')),
  content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
  evaluate: vi.fn().mockResolvedValue({
    title: 'Test Page',
    url: 'http://localhost:3000',
    bodyLength: 100,
    elementCount: 10,
    forms: [],
    links: [],
  }),
};

describe('ArtifactWriter', () => {
  let writer: ArtifactWriter;

  beforeEach(() => {
    writer = new ArtifactWriter('.agent-feedback/test');
    vi.clearAllMocks();
  });

  it('should initialize artifacts directory', async () => {
    const { ensureDir } = await import('../surface/utils/file.js');
    await writer.init();
    expect(ensureDir).toHaveBeenCalled();
  });

  it('should write screenshot', async () => {
    const path = await writer.writeScreenshot(mockPage as any, 'issue-001');
    expect(path).toContain('issue-001-screenshot.png');
    expect(mockPage.screenshot).toHaveBeenCalledWith({ path, fullPage: true });
  });

  it('should write HTML', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    const path = await writer.writeHtml(mockPage as any, 'issue-001');
    expect(path).toContain('issue-001-page.html');
    expect(mockPage.content).toHaveBeenCalled();
    expect(writeFileEnsured).toHaveBeenCalled();
  });

  it('should write DOM snapshot', async () => {
    const { writeFileEnsured } = await import('../surface/utils/file.js');
    const path = await writer.writeDomSnapshot(mockPage as any, 'issue-001');
    expect(path).toContain('issue-001-dom.json');
    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(writeFileEnsured).toHaveBeenCalled();
  });
});
