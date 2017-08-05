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

import P5Behavior from 'p5beh';

const pb = new P5Behavior();

const CENTER_DIAMETER = 50;

pb.draw = function (floor, p) {
  this.clear();
  let centerX = 0, centerY = 0, centerN = 0;
  for (let user of floor.users) {
    centerX += user.x;
    centerY += user.y;
    centerN++;
    pb.drawUser(user);
  }
  this.ellipse(centerX / centerN, centerY / centerN, CENTER_DIAMETER, CENTER_DIAMETER);

  centerX /= centerN;
  centerY /= centerN;
  this.ellipse(centerX, centerY, CENTER_DIAMETER, CENTER_DIAMETER);
  for (let user of floor.users) {
    this.line(user.x, user.y, centerX, centerY);
  }

    // Create the goal role.
    // WIP - lise

};


export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 4
};
export default behavior;
