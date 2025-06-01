export type Vec2 = {
  x: number
  y: number
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function mulN(v: Vec2, n: number): Vec2 {
  return { x: v.x * n, y: v.y * n }
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2
}
