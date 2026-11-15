export function startClock(tick: () => void, intervalMs: number): () => void {
  let stop: () => void;
  const fallBack = () => {
    const timer = setInterval(tick, intervalMs);
    stop = () => clearInterval(timer);
  };
  try {
    const worker = new Worker(new URL("./clockWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = tick;
    worker.onerror = () => {
      worker.terminate();
      fallBack();
    };
    worker.postMessage(intervalMs);
    stop = () => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };
  } catch {
    fallBack();
  }
  return () => stop();
}
