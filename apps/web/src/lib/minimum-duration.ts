export async function withMinimumDuration<T>(
  task: () => Promise<T>,
  minimumMs: number,
): Promise<T> {
  const startedAt = Date.now();

  try {
    return await task();
  } finally {
    const remainingMs = minimumMs - (Date.now() - startedAt);

    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs));
    }
  }
}
