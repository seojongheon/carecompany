export function createSerialTaskQueue() {
  let tail: Promise<unknown> = Promise.resolve();

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };
}
