import { afterEach, expect, test, vi } from "vitest";
import { createOutputPacer } from "./output-pacer";

afterEach(() => vi.useRealTimers());

test("typed echo and up to three output lines are immediate", () => {
  vi.useFakeTimers();
  const output: string[] = [];
  const pacer = createOutputPacer((chunk) => output.push(chunk));
  pacer.push("ls");
  pacer.push("\r\na\r\nb\r\n");
  expect(output).toEqual(["ls", "\r\na\r\nb\r\n"]);
  pacer.dispose();
});

test("a burst appears one line at a time and keeps trailing bytes in order", async () => {
  vi.useFakeTimers();
  const output: string[] = [];
  const pacer = createOutputPacer((chunk) => output.push(chunk));
  const lines = Array.from({ length: 10 }, (_, i) => `\u001b[32mline-${i}\u001b[0m\r\n`);
  pacer.push(lines.join(""));
  pacer.push("$ ");
  expect(output).toEqual([]);
  await vi.advanceTimersByTimeAsync(34);
  expect(output).toEqual([lines[0]]);
  await vi.runAllTimersAsync();
  expect(output.join("")).toBe(`${lines.join("")}$ `);
  expect(output.slice(0, 10)).toEqual(lines);
  pacer.dispose();
});

test("large and continuing bursts catch up within one and a half seconds", async () => {
  vi.useFakeTimers();
  const output: string[] = [];
  const pacer = createOutputPacer((chunk) => output.push(chunk));
  const burst = "one\r\n".repeat(600);
  pacer.push(burst);
  await vi.advanceTimersByTimeAsync(500);
  pacer.push(burst);
  expect(output.join("")).not.toBe(burst + burst);
  await vi.advanceTimersByTimeAsync(1000);
  expect(output.join("")).toBe(burst + burst);
  pacer.dispose();
});

test("a burst split across short messages is paced after its first few lines", async () => {
  vi.useFakeTimers();
  const output: string[] = [];
  const pacer = createOutputPacer((chunk) => output.push(chunk));
  for (let i = 0; i < 10; i++) pacer.push(`row-${i}\r\n`);
  expect(output).toEqual(["row-0\r\n", "row-1\r\n", "row-2\r\n"]);
  await vi.advanceTimersByTimeAsync(34);
  expect(output).toEqual(["row-0\r\n", "row-1\r\n", "row-2\r\n", "row-3\r\n"]);
  await vi.runAllTimersAsync();
  expect(output.join("")).toBe(Array.from({ length: 10 }, (_, i) => `row-${i}\r\n`).join(""));
  pacer.dispose();
});

test("prepared and manual typing catch up pending output before their immediate echo", async () => {
  vi.useFakeTimers();
  const output: string[] = [];
  const pacer = createOutputPacer((chunk) => output.push(chunk));
  const burst = "report\r\n".repeat(10);
  pacer.push(burst);
  pacer.push("$ next-command", false, true);
  expect(output).toEqual([burst, "$ next-command"]);
  pacer.push(burst);
  pacer.flush();
  pacer.push("ls");
  expect(output).toEqual([burst, "$ next-command", burst, "ls"]);
  await vi.runAllTimersAsync();
  expect(output).toEqual([burst, "$ next-command", burst, "ls"]);
  pacer.dispose();
});

test("a replay replaces pending output immediately and disposal stops future writes", async () => {
  vi.useFakeTimers();
  const output: string[] = [];
  const pacer = createOutputPacer((chunk) => output.push(chunk));
  pacer.push("stale\r\n".repeat(20));
  pacer.push(`\u001bc${"replay\r\n".repeat(20)}`, true);
  expect(output).toEqual([`\u001bc${"replay\r\n".repeat(20)}`]);
  pacer.push("new\r\n".repeat(20));
  pacer.dispose();
  await vi.runAllTimersAsync();
  expect(output).toEqual([`\u001bc${"replay\r\n".repeat(20)}`]);
});
