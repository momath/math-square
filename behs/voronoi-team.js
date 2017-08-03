/* MoMath Math Square Behavior
 *
 *        Title: Voronoi (Team)
 *  Description: Draw voronoi diagrams competing for area between two team colors
 * Scheduler ID: 9
 *    Framework: P5
 *       Author: ?
 *      Created: ?
 *      Updated: Allen He (he@momath.org), 6/1/17
 *       Status: partially works, score display unknown
 */

import {teamColors} from 'threectx';
import * as Display from 'display';
import Voro from 'lib/voronoi';
import P5Behavior from 'p5beh';

const pb = new P5Behavior();
var voroTeamColors = [0x6d1e9f,0x882558];
var v;
var nextTeam = 0; //var ghosts = [];
var output;

pb.preload = function (p) {}

pb.setup = function (p) {
  v = new Voro(this, [], true, voroTeamColors);
  let scene = document.getElementById('scene');
  output = document.createElement('div');
  scene.appendChild(output);
  output.style.position = 'absolute';
  output.style.top = '10px';
  output.style.left = '5px';
  output.style.right = '5px';
  output.style['text-align'] = 'center';
  output.style['font-weight'] = 'bolder';
  output.style['font-size'] = '20px';
  output.style['font-family'] = 'sans-serif';
  output.style.color = '#fff';
  output.style['z-index'] = '5000';
};

pb.draw = function (floor, p) {
  var teamOneArea = 0;
  var teamTwoArea = 0;

  for(var user of floor.users) {
    if(user.team == 0) teamOneArea += user.area;
    if(user.team == 1) teamTwoArea += user.area;
  }

  output.innerHTML = Math.floor(teamOneArea/1000) + " vs " + Math.floor(teamTwoArea/1000);

  v.resetPoints(floor.users);
};


function getNextTeam(users) {
  var teamOne = 0;
  var teamTwo = 0;
  for(id in users){
    if(users[i].team == 0) teamOne++;
    else teamTwo++; 
  }
  return (teamOne > teamTwo ? 1 : 0);
}

function onUserUpdate(newUsers, deletedUsers) {
  // Give new users a team
  for(var i = 0; i < newUsers.length; i++) {
    newUsers[i].team = nextTeam;
    nextTeam = (nextTeam + 1) % voroTeamColors.length;
  }
}

export const behavior = {
  title: "Voronoi Competition",
  frameRate: 'sensors',
  maxUsers: teamColors.length,
  numGhosts: 3,
  userUpdate: onUserUpdate,
  init: pb.init.bind(pb),
  render: pb.render.bind(pb),
};
export default behavior