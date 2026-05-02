// src/tests/utils/logger.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config so we control DEBUG flag per test
vi.mock('../../config/config.js', () => ({
  default: { DEBUG: true },
}));

import logger from '../../utils/logger.js';

describe('logger', () => {
  let errorSpy, warnSpy, infoSpy, logSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('logger.error always logs', () => {
    logger.error('boom');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('logger.warn always logs', () => {
    logger.warn('careful');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('logger.info logs when DEBUG=true', () => {
    logger.info('hello');
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('logger.debug logs when DEBUG=true', () => {
    logger.debug('detail');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('error output includes the [error] tag', () => {
    logger.error('msg');
    expect(errorSpy.mock.calls[0][0]).toMatch(/\[CertiPractice\]\[error\]/);
  });

  it('forwards multiple arguments', () => {
    logger.warn('a', 'b', { x: 1 });
    expect(warnSpy.mock.calls[0]).toContain('a');
    expect(warnSpy.mock.calls[0]).toContain('b');
    expect(warnSpy.mock.calls[0]).toContainEqual({ x: 1 });
  });

  it('exports both default and named logger', async () => {
    const mod = await import('../../utils/logger.js');
    expect(mod.default).toBe(mod.logger);
  });
});
