declare function setTimeout(callback: () => void, delay: number): number;
declare function clearTimeout(timer: number): void;

// Environment-neutral WHATWG API available in both browsers and Node.
declare class URLSearchParams {
  constructor(search: string);
  get(name: string): string | null;
}
