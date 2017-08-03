/* MoMath Math Square Behavior
 *
 *        Title: LSystem
 *  Description: Create L-System fractals from users
 * Scheduler ID: 
 *    Framework: Canvas2D
 *       Author: Dylan Simon <dylan@dylex.net>
 *      Created: 2017-04
 *       Status: in progress, mostly works
 */

import {Behavior} from 'behavior';
import * as Sensor from 'sensors';
import * as Display from 'display';
import Floor from 'floor';

type Point = {x: number, y: number}

function dist(p1: Point, p2: Point): number {
  let x = p1.x-p2.x,
      y = p1.y-p2.y;
  return Math.sqrt(x*x + y*y);
}

/* a rigid-body affine transform that maps points si to ti */
class Transform {
  a: number
  b: number
  x: number
  y: number
  s: number

  constructor(s1: Point, s2: Point, t1: Point, t2: Point) {
    const
      sx = s2.x-s1.x,
      sy = s2.y-s1.y,
      tx = t2.x-t1.x,
      ty = t2.y-t1.y,
      l = sx*sx + sy*sy;
    this.a = (sx*tx + sy*ty)/l;
    this.b = (sx*ty - sy*tx)/l;
    this.x = (sx*(s2.x*t1.x - s1.x*t2.x) + sy*(t1.x*s2.y - t2.x*s1.y) + ty*(s2.x*s1.y - s1.x*s2.y))/l;
    this.y = (sy*(s2.y*t1.y - s1.y*t2.y) + sx*(t1.y*s2.x - t2.y*s1.x) + tx*(s2.y*s1.x - s1.y*s2.x))/l;
    this.s = Math.sqrt(l/(tx*tx + ty*ty));
  }

  public apply(ctx: CanvasRenderingContext2D) {
    ctx.transform(this.a, this.b, -this.b, this.a, this.x, this.y);
    ctx.lineWidth *= this.s;
  }
}

var ctx: CanvasRenderingContext2D;

/* Shape information: these stay the same until someone moves:
 * transforms.length === points.length - 1 === N */
var points: Point[] = [];
var transforms: Transform[] = [];
var N: number = 0;

var hue = 0;
var pause = 0;

/* Drawing state: state.length === depth */
var state: number[] = [];
var depth: number = 0;
var budget: number = 0;

/* test if users have moved */
function samePoints(pts: Point[], thresh: number = 32): boolean {
  if (pts.length != points.length)
    return false;
  for (let i = 0; i < pts.length; i++)
    if (Math.abs(points[i].x - pts[i].x) > thresh || Math.abs(points[i].y - pts[i].y) > thresh)
      return false;
  return true;
}

/* update the points and transforms */
function setPoints(pts: Point[]) {
  hue = (hue + 2) % 360;
  points = pts.map((u) => { return {x:u.x,y:u.y} });
  N = points.length-1;
  state = [0,0];
  transforms = [];
  for (let i = 0; i < N; i++)
    transforms.push(new Transform(points[0], points[N], points[i], points[i+1]));
  ctx.setTransform(1, 0, 0, 1, 0, 0); // should be unnecessary
  ctx.clearRect(0, 0, Display.width, Display.height);
  budget = Infinity;

  depth = 0;
  draw(3);

  depth = 1;
  draw(2, 0.2+0.08*pause);
  iter(0);

  depth = 0;
}

/* handle one level of tree iteration */
function iter(d: number): boolean {
  if (d >= depth) {
    if (budget <= 0)
      return false;
    /* last level: draw */
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i <= N; i++)
      ctx.lineTo(points[i].x, points[i].y);
    budget -= N;
    return true;
  } else {
    /* continue iterating */
    for (let i = state[d]; i < N; i++) {
      ctx.save();
      transforms[i].apply(ctx);
      if (!iter(d+1)) {
	/* over budget, stop */
        state[d] = i;
        ctx.restore();
        return false;
      }
      ctx.restore();
    }
    state[d] = 0;
    return true;
  }
}

function draw(w: number, alpha?: number): boolean {
  ctx.lineWidth = w;
  ctx.strokeStyle = alpha == undefined ? 'white'
    : 'hsla('+(hue+23*depth)+',80%,60%,'+alpha+')';
  ctx.beginPath();
  let r = iter(0);
  ctx.stroke();
  return r;
}

function permute<T>(a: Array<T|undefined>, f: (p: Array<T>) => void, pfx: Array<T> = []) {
  let u = true;
  for (let i = 0; i < a.length; i++) {
    let x = a[i];
    if (x != undefined) {
      u = false;
      pfx.push(x);
      a[i] = undefined;
      permute(a, f, pfx);
      a[i] = pfx.pop();
    }
  }
  if (u)
    f(pfx);
}

/* Choose a path to use given a set of points */
function path(pts: Point[]): Point[] {
  /* first find farthest pair of points */
  let m = 0, mi = -1, mj = -1;
  for (let j = 0; j < pts.length; j++) {
    for (let i = 0; i < j; i++) {
      let d = dist(pts[i], pts[j]);
      if (d > m) {
	m = d;
	mi = i;
	mj = j;
      }
    }
  }
  
  let p1 = pts[mi],
      p2 = pts[mj],
      pa: Array<Point|undefined> = pts;
  pa[mi] = undefined;
  pa[mj] = undefined;

  /* now exhaustively find shorted path along rest */
  m = Infinity;
  let p = [p1];
  permute(pa, (a) => {
    let d = 0;
    for (let i = 1; i < a.length; i++)
      d += dist(a[i-1], a[i]);
    d += dist(a[a.length-1], p2);
    if (d < m) {
      m = d;
      p = a.slice();
    }
  }, p);
  p.push(p2);
  return p;
}

function reset() {
  points = [];
}

function init(container: HTMLDivElement) {
  let canvas = new Display.Canvas2DContext(container);
  ctx = canvas.context;
  container.addEventListener('touchstart', reset, false);
  container.addEventListener('mousedown', reset, false);
}

function frame(floor: Floor) {
  if (floor.users.length < 2)
    return;
  const users = floor.users.slice();
  users.sort((a,b) => a.id - b.id);
  users.splice(5); // only allow at most 5 points
  let pts = path(users);
  if (!samePoints(pts)) {
    pause = 0;
    setPoints(pts);
  } else if (!depth) {
    setPoints(pts);
    if (pause++ >= 10) {
      pause = 0;
      depth = 2;
    }
  } else if (pause-- <= 0 && depth < 20) {
    budget = 1024;
    if (draw(1, 1.05-0.05*depth)) {
      state[depth++] = 0;
      pause = 6-0.5*depth;
    }
  }
}

export const behavior: Behavior = {
  title: "L-System Fractals",
  frameRate: 20,
  // maxUsers: 4, /* only want oldest users */
  numGhosts: 3, /* maintain at least 3 (fake) users */
  ghostRate: 0.0001,
  init: init,
  render: frame
};
export default behavior
