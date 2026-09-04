import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_UPDATE_INTERVAL_MS = 125;
const MIN_UPDATE_INTERVAL_MS = 100;
const MAX_UPDATE_INTERVAL_MS = 250;

export type RepeatTimerSnapshot = {
  elapsedMs: number;
  progress: number;
  isComplete: boolean;
};

export type RepeatTimerController = {
  cancel: () => void;
};

type TimerHandle = ReturnType<typeof globalThis.setInterval>;

type RepeatTimerOptions = {
  durationMs: number;
  onTick: (snapshot: RepeatTimerSnapshot) => void;
  onComplete: () => void;
  updateIntervalMs?: number;
  now?: () => number;
  schedule?: (callback: () => void, intervalMs: number) => TimerHandle;
  clearSchedule?: (handle: TimerHandle) => void;
};

export type UseRepeatTimerOptions = {
  durationMs: number;
  onComplete: () => void;
  active?: boolean;
  updateIntervalMs?: number;
};

export type UseRepeatTimerResult = RepeatTimerSnapshot & {
  cancel: () => void;
};

const INITIAL_SNAPSHOT: RepeatTimerSnapshot = {
  elapsedMs: 0,
  progress: 0,
  isComplete: false,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateRepeatTimerSnapshot(
  startedAtMs: number,
  currentTimeMs: number,
  durationMs: number,
): RepeatTimerSnapshot {
  const elapsedMs = Math.max(0, currentTimeMs - startedAtMs);
  const progress =
    durationMs <= 0 ? 1 : clamp(elapsedMs / durationMs, 0, 1);

  return {
    elapsedMs,
    progress,
    isComplete: progress === 1,
  };
}

export function normalizeUpdateInterval(intervalMs: number | undefined): number {
  if (intervalMs === undefined || !Number.isFinite(intervalMs)) {
    return DEFAULT_UPDATE_INTERVAL_MS;
  }

  return clamp(intervalMs, MIN_UPDATE_INTERVAL_MS, MAX_UPDATE_INTERVAL_MS);
}

export function createRepeatTimer({
  durationMs,
  onTick,
  onComplete,
  updateIntervalMs,
  now = Date.now,
  schedule = (callback, intervalMs) =>
    globalThis.setInterval(callback, intervalMs),
  clearSchedule = (handle) => globalThis.clearInterval(handle),
}: RepeatTimerOptions): RepeatTimerController {
  const startedAtMs = now();
  let handle: TimerHandle | undefined;
  let cancelled = false;
  let completed = false;

  const finishOnce = (): void => {
    if (completed || cancelled) {
      return;
    }

    completed = true;
    if (handle !== undefined) {
      clearSchedule(handle);
      handle = undefined;
    }
    onComplete();
  };

  const update = (): void => {
    if (cancelled || completed) {
      return;
    }

    const snapshot = calculateRepeatTimerSnapshot(
      startedAtMs,
      now(),
      durationMs,
    );
    onTick(snapshot);

    if (snapshot.isComplete) {
      finishOnce();
    }
  };

  update();

  if (!completed) {
    handle = schedule(update, normalizeUpdateInterval(updateIntervalMs));
  }

  return {
    cancel: () => {
      if (cancelled) {
        return;
      }

      cancelled = true;
      if (handle !== undefined) {
        clearSchedule(handle);
        handle = undefined;
      }
    },
  };
}

export function useRepeatTimer({
  durationMs,
  onComplete,
  active = true,
  updateIntervalMs,
}: UseRepeatTimerOptions): UseRepeatTimerResult {
  const [snapshot, setSnapshot] = useState<RepeatTimerSnapshot>(INITIAL_SNAPSHOT);
  const controllerRef = useRef<RepeatTimerController | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setSnapshot(INITIAL_SNAPSHOT);

    if (!active) {
      controllerRef.current = null;
      return;
    }

    const controller = createRepeatTimer({
      durationMs,
      onTick: setSnapshot,
      onComplete: () => onCompleteRef.current(),
      updateIntervalMs,
    });
    controllerRef.current = controller;

    return () => {
      controller.cancel();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [active, durationMs, updateIntervalMs]);

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
    controllerRef.current = null;
  }, []);

  return { ...snapshot, cancel };
}
