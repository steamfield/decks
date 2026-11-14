export interface Point {
  x: number;
  y: number;
}
export function polylinePath(points: Point[]): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return points.map((p, i) => `${i ? "L" : "M"}${r(p.x)} ${r(p.y)}`).join("");
}
