import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
});

describe('test environment', () => {
  it('advances elapsed time deterministically with fake timers', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    setTimeout(callback, 1_000);
    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
  });
});
