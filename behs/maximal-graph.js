/* MoMath Math Square Behavior
 *
 *        Title: Maximal Graph
 *  Description: Displays maximal graph with each user as a node
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Allen He <he@momath.org>
 *      Created: 2017-05-23
 *       Status: works
 */

import P5Behavior from 'p5beh';

const pb = new P5Behavior();

pb.draw = function (floor, p) {
  this.clear();
  for (let user1 of floor.users) {
    for(let user2 of floor.users) {
        this.stroke('#ffff7D')
        this.line(user1.x, user1.y, user2.x, user2.y)
    }
    pb.drawUser(user1);
  }
};


export const behavior = {
  title: "Maximal Graph (P5)",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 4
};
export default behavior
