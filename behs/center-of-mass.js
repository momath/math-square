/* MoMath Math Square Behavior
 *
 *        Title: Center of Mass
 *  Description: Displays center of mass of users
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Brian Sapozhnikov <brian.sapozhnikov@gmail.com>,  Lise Ho <lise.ho6@gmail.com>, Shaan Sheikh <shaansweb@gmail.com>
 *      Created: 2017-08-05
 *       Status: works
 */

/** Imports and Constants **/
import P5Behavior from 'p5beh';
import * as Display from 'display';

const pb = new P5Behavior();

const CENTER_RADIUS = 20;

// Create Constants for hole specs.
const HOLE_DIAMETER = 20;
const HOLE_X = parseInt(Math.random() * Display.width);
const HOLE_Y = parseInt(Math.random() * Display.height);
console.log(Display.width);
console.log(Display.height);

/** Helper Functions **/
const drawCircle = function(x, y, r) {
  this.ellipse(x, y, r * 2, r * 2);
};

/** Lifecycle Functions **/
pb.setup = function(p) {
  this.drawCircle = drawCircle;
};

pb.draw = function(floor, p) {
  this.clear();
  let centerX = 0, centerY = 0, numUsers = 0;
  for (let user of floor.users) {
    centerX += user.x;
    centerY += user.y;
    numUsers++;
    pb.drawUser(user);
  }
  centerX /= numUsers;
  centerY /= numUsers;
  this.drawCircle(centerX, centerY, CENTER_RADIUS);
  for (let user of floor.users) {
    this.line(user.x, user.y, centerX, centerY);
  }

  let holeC = this.color(202,22,13); // Reddish color
  this.fill(holeC);
  this.ellipse(HOLE_X, HOLE_Y, HOLE_DIAMETER, HOLE_DIAMETER);
};

/** Export **/
export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 2
};
export default behavior;
