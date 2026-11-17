/** Pace bursts without delaying keystrokes, short replies or session replays. */
export function createOutputPacer(write: (chunk: string, replay: boolean) => void) {
  let pending = "";
  let deadline = 0;
  let recentLines = 0;
  let windowStarted = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const interval = 1000 / 30;
  const clear = () => {
    clearTimeout(timer);
    timer = undefined;
    pending = "";
    recentLines = 0;
    windowStarted = Date.now();
  };
  const flush = () => {
    const chunk = pending;
    clear();
    if (chunk) write(chunk, false);
  };
  const drain = () => {
    timer = undefined;
    const lines = pending.split("\n");
    const ticks = Math.max(1, Math.floor((deadline - Date.now()) / interval));
    const count = Math.max(1, Math.ceil(lines.length / ticks));
    const chunk = lines.splice(0, count).join("\n");
    write(chunk + (lines.length ? "\n" : ""), false);
    pending = lines.join("\n");
    if (pending) timer = setTimeout(drain, interval);
  };
  return {
    push(chunk: string, replay = false, immediate = false) {
      if (replay) {
        clear();
        write(chunk, true);
        return;
      }
      if (immediate) {
        flush();
        write(chunk, false);
        return;
      }
      if (Date.now() - windowStarted >= interval) {
        windowStarted = Date.now();
        recentLines = 0;
      }
      const lines = chunk.split("\n").length - 1;
      if (timer === undefined && recentLines + lines <= 3) {
        recentLines += lines;
        write(chunk, false);
        return;
      }
      pending += chunk;
      if (timer === undefined) {
        deadline = Date.now() + 1500;
        timer = setTimeout(drain, interval);
      }
    },
    flush,
    dispose: clear,
  };
}
