declare class p5 {
  constructor(sketch: (p: p5) => void, node?: HTMLElement|boolean, sync?: boolean)
  remove(): void
  noLoop(): void
  loop(): void
  redraw(): void
  setup?: () => void
  draw?: () => void
  createCanvas(width: number, height: number, renderer?: 'p2d'|'webgl'): void
  /* lots more stuff... */
  [prop: string]: any
}

declare module "p5" {
  export default p5
}
