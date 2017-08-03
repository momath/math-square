/* MoMath Math Square Behavior
 *
 *        Title: Sensors
 *  Description: Display raw sensors, used for 'record' meta-behavior
 * Scheduler ID: 
 *    Framework: Canvas2D
 *       Author: Dylan Simon <dylan@dylex.net>
 *      Created: 2017-04
 *       Status: works
 */

import {Behavior} from 'behavior';
import * as Sensor from 'sensors';
import * as Display from 'display';
import Floor from 'floor';

var ctx: CanvasRenderingContext2D;

function render(floor: Floor) {
  var input = floor.sensors;
  /* clear canvas */
  ctx.clearRect(0, 0, Sensor.width, Sensor.height);

  /* draw each sensor */
  for (let i: Sensor.Index|undefined = new Sensor.Index(); i; i = i.incr())
    if (input.get(i))
      ctx.fillRect(i.x+0.05, i.y+0.05, 0.9, 0.9);
}

function init(container: HTMLDivElement) {
  const canvas = new Display.Canvas2DContext(container);
  ctx = canvas.context;
  /* set default color */
  ctx.fillStyle = 'white';
  /* scale to sensor space */
  ctx.setTransform(Display.sensorWidth, 0, 0, Display.sensorHeight, 0, 0);
}

export const behavior: Behavior = {
  title: "Sensor Debug (Canvas2D)",
  frameRate: 'sensors',
  maxUsers: 0,
  init: init,
  render: render
};
export default behavior
