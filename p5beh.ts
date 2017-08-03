/* MoMath Math Square P5 interface
 * Provides shims for using a P5 drawing as a behavior.
 * Note that this replaces the P5 main rendering loop with normal Math Square one.
 */

import * as Display from 'display'
import * as Sensor from 'sensors'
import Floor from 'floor'
import {User} from 'floor'
import p5 from 'p5'

export default class P5Behavior {
  public p5: p5
  public preload?: (this: p5, p5: p5) => void
  public setup?: (this: p5, p5: p5) => void
  public draw?: (this: p5, floor: Floor, p5: p5) => void
  public renderer?: 'p2d'|'webgl'

  constructor(public sketch?: (p5: p5) => void) {
  }

  /* Should be called from/as Behavior.init */
  init(container: HTMLDivElement) {
    this.p5 = new p5((p: p5) => {
      this.p5 = p;
      if (this.preload)
        p.preload = this.preload.bind(p, p);
      p.setup = () => {
        p.createCanvas(Display.width, Display.height, this.renderer);
        if (this.setup)
          this.setup.call(p, p);
      };
      if (this.sketch)
        this.sketch(p);
      if (!p.draw) {
        /* don't draw anything yet */
        p.draw = function () {};
        p.noLoop();
      }
    }, container, true);
  }

  /* Should be called from/as Behavior.render */
  render(floor: Floor) {
    if (this.draw)
      this.p5.draw = this.draw.bind(this.p5, floor, this.p5);
    this.p5._draw(); // this.p5.redraw();
  }

  /* Draw the sphere for a user, just like THREEContext.updateUsers does */
  drawUser(user: User) {
    this.p5.fill(user.id >= 0 ? Display.teamColors[user.id%Display.teamColors.length] : 255);
    this.p5.noStroke();
    this.p5.ellipse(user.x, user.y, 24);

    this.p5.noFill();
    this.p5.stroke(68);
    this.p5.strokeWeight(1);
    this.p5.ellipse(user.x, user.y, 31);
  }

  /* Draw a grid of sensors, using the current drawing style */
  drawSensors(sensors: Sensor.Grid) {
    this.p5.applyMatrix(Display.sensorWidth, 0, 0, Display.sensorHeight, 0, 0);
    for (let i: Sensor.Index|undefined = new Sensor.Index(); i; i = i.incr())
      if (sensors.get(i))
	this.p5.rect(i.x+0.05, i.y+0.05, 0.9, 0.9);
  }
}
