"use client";

import { useSyncExternalStore, useCallback } from "react";

const KEY = "debug";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return localStorage.getItem(KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

export function useDebug() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => {
    localStorage.setItem(KEY, enabled ? "0" : "1");
    notify();
  }, [enabled]);
  return [enabled, toggle] as const;
}
