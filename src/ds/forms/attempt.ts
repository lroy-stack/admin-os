export interface Attempt {
  readonly key: string;
  readonly input: string;
}

/**
 * One attempt key per attempt: a retry of the same input after a transport failure reuses the failed attempt's key
 * (the server may have written already, and the key makes the replay safe); anything else gets a fresh key.
 */
export function attemptFor(previous: Attempt | undefined, input: unknown, newKey: () => string): Attempt {
  // biome-ignore lint/suspicious/noUnnecessaryConditions: JSON.stringify returns undefined for undefined input; its lib type says string.
  const serialized = JSON.stringify(input) ?? "";
  return previous?.input === serialized ? previous : { key: newKey(), input: serialized };
}
