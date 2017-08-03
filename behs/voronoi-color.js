/* MoMath Math Square Behavior
 *
 *        Title: Voronoi (Color)
 *  Description: Draw voronoi diagrams giving each user their own color
 * Scheduler ID: 8
 *    Framework: P5
 *       Author: ?
 *      Created: ?
 *      Updated: Allen He (he@momath.org), 6/1/17
 *       Status: works
 */

import P5Behavior from 'p5beh';
import * as Display from 'display';
import Voro from 'lib/voronoi';
import {teamColors} from 'threectx';

var v;
var nextTeam = 0;

const pb = new P5Behavior();

// for WEBGL: pb.renderer = 'webgl';

pb.preload = function (p) {}

pb.setup = function (p) {
  v = new Voro(this, [], true, teamColors);
};

pb.draw = function (floor, p) {
  v.resetPoints(floor.users);
};


function chooseTeam(users, old) {
  if (old && old.team != undefined)
    return old.team;
  var teams = {}, n = 0;
  for (var u of users)
    if (u.team != undefined)
      teams[u.team] = n++;
  nextTeam = (nextTeam + 1) % teamColors.length;
  if (n >= teamColors.length) /* shouldn't happen */
    return nextTeam;
  while (nextTeam in teams)
    nextTeam = (nextTeam + 1) % teamColors.length;
  return nextTeam;
}

function onUserUpdate(newUsers, deletedUsers, users) {
  for(var user of newUsers) {
    user.team = chooseTeam(users, deletedUsers.pop());
    users.push(user);
  }
}

export const behavior = {
  title: "Voronoi",
  frameRate: 'sensors',
  maxUsers: teamColors.length,
  numGhosts: 3,
  userUpdate: onUserUpdate,
  init: pb.init.bind(pb),
  render: pb.render.bind(pb),
};
export default behavior;