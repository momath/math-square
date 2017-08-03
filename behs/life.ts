/* MoMath Math Square Behavior
 *
 *        Title: Life
 *  Description: Play Conway's Game of Life on sensors
 * Scheduler ID: 21
 *    Framework: Canvas2D
 *       Author: Dylan Simon <dylan@dylex.net>
 *      Created: 2017-03
 *      Updated: 2017-04 for SDK by dylan
 *       Status: works
 */

import {Behavior} from 'behavior';
import * as Sensor from 'sensors';
import * as Display from 'display';
import Floor from 'floor';

const FPS = 20; /* frames/second or 0 for max */
const MAX = 30*(FPS || 60); /* maximum cell age: 30 seconds */
const QUIET = 10*(FPS || 60); /* quiet timeout: random 0~10 seconds */

/* Coordinates of eight neigbor cells */
const neighbors = [
  new Sensor.Coord(-1, -1),
  new Sensor.Coord( 0, -1),
  new Sensor.Coord( 1, -1),
  new Sensor.Coord(-1,  0),
  new Sensor.Coord( 1,  0),
  new Sensor.Coord(-1,  1),
  new Sensor.Coord( 0,  1),
  new Sensor.Coord( 1,  1),
];

/* blocks to populate randomly when quiet */
const guys = [
  [[1,1], /* block */
   [1,1]],
  [[0,1,1,0], /* beehive */
   [1,0,0,1],
   [0,1,1,0]],
  [[0,1,1,0], /* loaf */
   [1,0,0,1],
   [0,1,0,1],
   [0,0,1,0]],
  [[1,1,0], /* boat */
   [1,0,1],
   [0,1,0]],
  [[0,1,0], /* tub */
   [1,0,1],
   [0,1,0]],
  [[1,1,1]], /* blinker */
  [[0,1,1,1], /* toad */
   [1,1,1,0]],
  [[1,1,0,0], /* beacon */
   [1,0,0,0],
   [0,0,0,1],
   [0,0,1,1]],
  [[0,1,0], /* glider */
   [0,0,1],
   [1,1,1]],
  [[1,0,0,1,0], /* lightweight spaceship */
   [0,0,0,0,1],
   [1,0,0,0,1],
   [0,1,1,1,1]],
  [[0,1,1], /* R-pentomino */
   [1,1,0],
   [0,1,0]],
];

/* cell color given age */
function color(t: number): string|undefined {
  if (!t)
    return;
  const f = 1-(t-1)/MAX;
  return 'hsl(' + Math.round(240+360*f) + ',100%,' + Math.round(100*f) + '%)'
}

var canvas: Display.Canvas2DContext;
var ctx: CanvasRenderingContext2D;
/* current state (age), updated from sensors and displayed */
var state = new Sensor.UIntGrid();
/* quiet timer */
var quiet = 0;

function step(floor: Floor) {
  var input = floor.sensors;
  ctx.clearRect(0, 0, Sensor.width, Sensor.height);

  const prev = state;
  state = new Sensor.UIntGrid();
  var q = 0;
  for (let i: Sensor.Index|undefined = new Sensor.Index(); i; i = i.incr()) {
    let c = <number>prev.get(i); /* current state (age) */
    if (input.get(i)) {
      /* if sensor is active, force cell live */
      q++;
      c++;
    } else {
      let n = 0;
      /* count living neighbors */
      for (let j of neighbors)
        if (prev.get(i.plus(j)))
          n++;
      switch (n) {
        case 2:
	  /* leave as-is */
          if (c)
            c++;
          break;
        case 3:
	  /* vivify */
          c++;
          break;
        default:
	  /* kill */
          c = 0;
          break;
      }
    }
    /* age out */
    if (c > MAX)
      c = 0;
    state.set(i, c);
  }

  /* check for quiet time to add noise */
  if (q >= 4)
    quiet = QUIET*Math.random();
  else if (quiet++ > QUIET) {
    quiet = QUIET*Math.random();
    /* add random guy */
    const guy = guys[Math.floor(guys.length*Math.random())];
    /* random position */
    let x0 = Math.floor((Sensor.width-guy[0].length)*Math.random()),
        y0 = Math.floor((Sensor.height-guy.length)*Math.random()),
        xx = 1, xy = 0, yx = 0, yy = 1;
    /* random orientation */
    const o = 8*Math.random();
    if (o & 1) {
      xx = -1;
      x0 = Sensor.width-x0-1;
    }
    if (o & 2) {
      yy = -1;
      y0 = Sensor.height-y0-1;
    }
    if (o & 4) {
      let t = x0; x0 = y0; y0 = t;
      yx = xx;
      xy = yy;
      xx = yy = 0;
    }
    for (let y = 0; y < guy.length; y++)
      for (let x = 0; x < guy[y].length; x++)
        if (guy[y][x]) {
          const i = new Sensor.Index(x0+xx*x+yx*y, y0+xy*x+yy*y);
          state.set(i, 1);
        }
  }

  /* draw */
  for (let i: Sensor.Index|undefined = new Sensor.Index(); i; i = i.incr()) {
    const c = color(<number>state.get(i));
    if (!c)
      continue;
    ctx.fillStyle = c;
    ctx.fillRect(i.x+0.05, i.y+0.05, 0.9, 0.9);
  }
}

function init(container: HTMLDivElement) {
  canvas = new Display.Canvas2DContext(container);
  ctx = canvas.context;
  /* work in sensor space */
  ctx.setTransform(Display.sensorWidth, 0, 0, Display.sensorHeight, 0, 0);
}

export const behavior: Behavior = {
  title: "Conway's Game of Life",
  frameRate: FPS || 'animate',
  maxUsers: 0, /* no user tracking */
  init: init,
  render: step
};
export default behavior
