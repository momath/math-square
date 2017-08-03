/* MoMath Math Square Behavior
 *
 *        Title: MoMath Logo
 *  Description: Interactive MoMath Logo Generator
 * Scheduler ID: 20
 *    Framework: Canvas2D
 *       Author: Dylan Simon <dylan@dylex.net>
 *      Created: 2017-03
 *       Status: in progess, works
 */

import {Behavior} from 'behavior';
import * as Sensor from 'sensors';
import * as Display from 'display';
import Floor from 'floor';
import {User} from 'floor';
import {TAU, LogoCanvas, LogoParams} from 'lib/logo';

var canvas: Display.Canvas2DContext
var l: LogoCanvas

function init(container: HTMLDivElement) {
  canvas = new Display.Canvas2DContext(container);
  l = new LogoCanvas(canvas.canvas);
  LogoParams.loadPaths(undefined, 'lib/logo-chars.json');
}

function userpos(u: User): {x: number, y: number, r: number, t: number} {
  let x = 2*u.x/Display.width - 1,
      y = 2*u.y/Display.height - 1;
  return {
    x: x, y: y,
    r: Math.sqrt(x*x + y*y),
    t: Math.PI-Math.atan2(y, x)
  };
}

function frame(floor: Floor) {
  let p = new LogoParams();
  p.animate(performance.now());
  if (floor.users.length) {
    let users = floor.users.slice();
    users.sort((a, b) => a.id - b.id);

    var u1 = <User>users.shift()
    let p1 = userpos(u1);
    p.radius = p1.r;
    p.orientation = p1.t % Math.PI;

    var u2 = users.shift();
    if (u2) {
      let p2 = userpos(u2);
      p.size = p2.r/2;
      p.rotation = TAU - p2.t;

      var u3 = users.shift();
      if (u3) {
        let p3 = userpos(u3);
        p.dihedral = p3.t-p1.t;
      } else
        p.dihedral = null;
    }

    p.setSymbol(u1.id); // users.reduce((s, u) => s+u.id, 0)
    l.params = new LogoParams(l.params, p, 0.1);
  } else {
    l.params = p;
  }
  l.draw();
}

export const behavior: Behavior = {
  title: "MoMath Logo Generator",
  frameRate: 'animate',
  // maxUsers: 3, // actually want oldest users, not largest users
  init: init,
  render: frame
};
export default behavior
