/* MoMath Math Square Behavior
 *
 *        Title: Center of Mass
 *  Description: Displays center of mass of users
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Brian Sapozhnikov <brian.sapozhnikov@gmail.com>,  Lise Ho <lise.ho6@gmail.com>, ***ENTER NAMES HERE***
 *      Created: 2017-08-05
 *       Status: works
 */

/** Imports and Constants **/
import P5Behavior from 'p5beh';

const pb = new P5Behavior();

const CENTER_RADIUS = 20;

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
};

/** Export **/
export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 4
};
export default behavior;
