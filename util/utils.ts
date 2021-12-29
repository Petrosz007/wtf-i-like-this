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

export class HttpRequestError extends Error {
  constructor(public status: number, public message: string) {
    super();
  }
}

export class OwnApiRequestError extends Error {
  constructor(public status: number, public message: string) {
    super();
  }
}

export async function fetchAsJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText);
  }
  const data = (await response.json()) as T;

  return data;
}

export async function fetchOwnApiAsJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await response.json()) as { message: string };
    throw new OwnApiRequestError(response.status, body.message);
  }
  const data = (await response.json()) as T;

  return data;
}
