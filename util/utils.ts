import { DependencyList, useEffect } from 'react';

type EffectCallbackAsync = () => Promise<void | never>;

export function useEffectAsync(
  effect: EffectCallbackAsync,
  deps?: DependencyList,
): void {
  useEffect(() => {
    effect();
  }, deps);
}

export async function fetchAsJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(
      `Response faliure with status code: ${response.status}: ${response.statusText}`,
    );
  }
  const data = (await response.json()) as T;

  return data;
}
