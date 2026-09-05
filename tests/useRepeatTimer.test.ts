import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calculateRepeatTimerSnapshot,
  createRepeatTimer,
  normalizeUpdateInterval,
  type RepeatTimerSnapshot,
} from '../src/hooks/useRepeatTimer';

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateRepeatTimerSnapshot', () => {
  it('starts at zero progress', () => {
    expect(calculateRepeatTimerSnapshot(1_000, 1_000, 15_000)).toEqual({
      elapsedMs: 0,
      progress: 0,
      isComplete: false,
    });
  });

  it('reports half progress at 7.5 seconds of a 15 second session', () => {
    expect(calculateRepeatTimerSnapshot(1_000, 8_500, 15_000)).toEqual({
      elapsedMs: 7_500,
      progress: 0.5,
      isComplete: false,
    });
  });

  it('clamps progress to the range from zero to one', () => {
    expect(calculateRepeatTimerSnapshot(1_000, 500, 15_000).progress).toBe(0);
    expect(calculateRepeatTimerSnapshot(1_000, 20_000, 15_000)).toEqual({
      elapsedMs: 19_000,
      progress: 1,
      isComplete: true,
    });
  });
});

describe('normalizeUpdateInterval', () => {
  it('keeps UI updates within the supported frequency range', () => {
    expect(normalizeUpdateInterval(undefined)).toBe(125);
    expect(normalizeUpdateInterval(Number.NaN)).toBe(125);
    expect(normalizeUpdateInterval(10)).toBe(100);
    expect(normalizeUpdateInterval(175)).toBe(175);
    expect(normalizeUpdateInterval(1_000)).toBe(250);
  });
});

describe('createRepeatTimer', () => {
  it('uses elapsed wall-clock time and completes exactly once', () => {
    vi.useFakeTimers();
    let currentTime = 10_000;
    const snapshots: RepeatTimerSnapshot[] = [];
    const onComplete = vi.fn();

    createRepeatTimer({
      durationMs: 15_000,
      onTick: (snapshot) => snapshots.push(snapshot),
      onComplete,
      now: () => currentTime,
    });

    expect(snapshots.at(-1)?.progress).toBe(0);

    currentTime = 17_500;
    vi.advanceTimersToNextTimer();
    expect(snapshots.at(-1)?.progress).toBe(0.5);
    expect(onComplete).not.toHaveBeenCalled();

    currentTime = 25_000;
    vi.advanceTimersToNextTimer();
    expect(snapshots.at(-1)).toEqual({
      elapsedMs: 15_000,
      progress: 1,
      isComplete: true,
    });
    expect(onComplete).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(30_000);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('finishes after a delayed interval according to the current clock', () => {
    vi.useFakeTimers();
    let currentTime = 0;
    const onComplete = vi.fn();

    createRepeatTimer({
      durationMs: 15_000,
      onTick: vi.fn(),
      onComplete,
      updateIntervalMs: 250,
      now: () => currentTime,
    });

    currentTime = 20_000;
    vi.advanceTimersToNextTimer();

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('clears its scheduled work when the elapsed duration completes', () => {
    let currentTime = 0;
    let scheduledUpdate: (() => void) | undefined;
    const handle = 7 as unknown as ReturnType<typeof globalThis.setInterval>;
    const clearSchedule = vi.fn();
    const onComplete = vi.fn();

    createRepeatTimer({
      durationMs: 1_000,
      onTick: vi.fn(),
      onComplete,
      now: () => currentTime,
      schedule: (update) => {
        scheduledUpdate = update;
        return handle;
      },
      clearSchedule,
    });

    currentTime = 1_000;
    scheduledUpdate?.();

    expect(clearSchedule).toHaveBeenCalledOnce();
    expect(clearSchedule).toHaveBeenCalledWith(handle);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('stops updates and completion after cancellation', () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    const onComplete = vi.fn();
    const controller = createRepeatTimer({
      durationMs: 1_000,
      onTick,
      onComplete,
    });

    expect(onTick).toHaveBeenCalledOnce();
    controller.cancel();
    controller.cancel();
    vi.advanceTimersByTime(2_000);

    expect(onTick).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
