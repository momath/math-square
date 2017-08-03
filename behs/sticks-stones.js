/* MoMath Math Square Behavior
 *
 *        Title: Sticks Stones
 *  Description: Draw polygons from some users and maximum-size non-intersection circles for others
 * Scheduler ID: 3
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *       Status: unknown, mostly working
 */

import THREEContext from 'threectx';
import {teamColors} from 'threectx';
import * as THREE from 'three';
import * as Display from 'display';
import {Ghost} from 'floor';
import TeamBorder from 'lib/teamborder';

var context;

function Stick(_p1, _p2, _i1, _i2){
  this.startPoint = _p1;
  this.endPoint = _p2;
  var geo = new THREE.Geometry();
  geo.vertices.push(this.startPoint);
  geo.vertices.push(this.endPoint);
  this.name = _i1 + "-" + _i2;
  this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0x007fff,linewidth:2}));
  context.scene.add(this.line);
}

Stick.prototype.remove = function(){
  context.scene.remove(this.line);
}

Stick.prototype.draw = function(){
  // ?
}

function Stone(_vert, name, color){
  this.position = new THREE.Vector3(_vert.x,_vert.y, _vert.z);
  this.circle = new THREE.Mesh(new THREE.SphereGeometry(1,15,15), new THREE.MeshBasicMaterial({color:color, opacity:0.8}));
  this.size = 15;
  this.name = name;
  context.scene.add(this.circle);
  //this.draw();
}

Stone.prototype.remove = function() {
  context.scene.remove(this.circle);
};

Stone.prototype.setRandomPosition = function(){
  this.position.x = Math.random() * Display.width;
  this.position.y = Math.random() * Display.height;
  this.draw();
}

var border;

Stone.prototype.draw = function(stickVertices, stoneUsers){
  var intersectDistance = 100000,
    minDistance = 5;

  // Our goal at the end of the following blob of code is to know how big we
  // can be and not intersect anything else in the board, where "anything else"
  // means: a ghost, a stick between two ghosts, another stone, or the boundaries
  // of the board.
  // To do this, we will find the minimum of the distance between ourself and
  // all of the other objects we mentioned.
  // Worst case scenario, this will require a ton of checks. As a small
  // optimization, we can stop if we find ourselves at minDistance; we get no
  // smaller than that anyway.

  // Start with the most likely (and easiest to compute) case; we're hitting a boundary
  for(var i = 1; i < border.boundary.vertices.length; i++) {
    var dist = this.minimumDistanceToLineSegment(border.boundary.vertices[i-1], border.boundary.vertices[i]);

    if(dist < intersectDistance) {
      intersectDistance = dist;
      if(intersectDistance < minDistance)
        break;
    }
  }

  // Now, check other stones (this is less work than all ghosts/sticks).
  // Only need to do this if we're not already as small as we're going to get.
  if(intersectDistance > minDistance) {
    // TODO: ... stones ... will be... ghosts? ... eventually? or something?
    // For now, relying on the global array of them.
    for(var i = 0; i < stoneUsers.length; i++) {
      var stone = stoneUsers[i].stone;
      if(stone === this) continue;
      var dist = this.position.distanceTo(stone.position) - stone.size; // adjust for the radius of the other stone

      if(dist < minDistance) {
        // We cannot be small enough to not intersect the other stone. Shrink
        // the other stone by the amount needed to allow us to be our minimum size.
        stone.size -= minDistance - dist;
        dist = minDistance;
      }

      if(dist < intersectDistance) {
        intersectDistance = dist;
        if(intersectDistance <= minDistance)
          break;
      }
    }
  }

  // And finally, check other ghosts and the lines between them. Again, only
  // if we're not already at our minimum size.
  if(intersectDistance > minDistance) {
    for(var i = 0; i < stickVertices.length; i++) {
      var stickVertex = stickVertices[i],
        dist;

      // First check our distance to this ghost itself.
      // TODO: optimization - get rid of these distanceTo calls in favor of
      // distance formula function. distanceTo() allocates a new Vector3,
      // just to throw it away, and we're doing it a whole whole lot.
      dist = stickVertex.distanceTo(this.circle.position);
      if(dist < intersectDistance) {
        intersectDistance = dist;
        if(intersectDistance <= minDistance)
          break;
      }

      // Then check our distance to the line segments between this ghost and
      // all the others. Note that we are starting at i+1 in the ghosts array,
      // since the line from ghosts A -> B is the same as that from B -> A.
      for(var j = i + 1; j < stickVertices.length; j++) {
        dist = this.minimumDistanceToLineSegment(stickVertex, stickVertices[j]);

        if(dist < intersectDistance) {
          intersectDistance = dist;
          if(intersectDistance <= minDistance)
            break;
        }
      }

      if(intersectDistance <= minDistance)
        break;
    }
  }

  this.size = Math.max(intersectDistance, minDistance) - 1;  // a smidge of a fudge factor, for padding

  this.circle.position.set(this.position.x,this.position.y,0);
  this.circle.scale.x = this.circle.scale.y = Math.floor(this.size) ;
}

// Returns the minimum distance from the center of the Stone to a point on the
// line _segment_ between points a and b. If the closest point from the center
// to the line defined by the points is not within the segment, the distance
// to the closer of the endpoints is returned.
// If a==b, returns the distance from the center to the point.
// TODO: possible optimization would be to deal in squares of distance, thus
// saving the ton of sqrts we're doing just to throw away.
Stone.prototype.minimumDistanceToLineSegment = function(a, b) {
  function dist(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  var bX = b.x;
  var bY = b.y;
  var aX = a.x;
  var aY = a.y;
  var cX = this.position.x;
  var cY = this.position.y;
  var R = this.size;

  var dX = bX - aX;
  var dY = bY - aY;
  if ((dX == 0) && (dY == 0)){
    // A and B are the same points; just the distance formula
    return dist(cX, cY, aX, aY);
  }

  var dl = (dX * dX + dY * dY);
  var t = ((cX - aX) * dX + (cY - aY) * dY) / dl;

  // In these two cases, the closest point on the line is not within the segment,
  // so return the distance to the closer endpoint of the segment.
  if(t < 0) return dist(cX, cY, aX, aY);
  if(t > 1) return dist(cX, cY, bX, bY);

  // Otherwise we have a winner:
  var nearestX = aX + t * dX,
    nearestY = aY + t * dY;

  return dist(cX, cY, nearestX, nearestY);
};


var shortestPairing = new Object();
var stickLines = [];

var ghostBounds;

var nextTeamColorIdx = 0;

function init(container) {
  context = new THREEContext(container, true);

  var borderTileSize = 24;
  border = new TeamBorder(Display.width, borderTileSize, [
    { name: 'stick', image: 'images/stick.png' },
    { name: 'stone', image: 'images/stone.png' }
  ]);
  border.addToScene(context.scene);

  ghostBounds = { x: borderTileSize, y: borderTileSize,
    width: Display.width - borderTileSize * 2,
    height: Display.height - borderTileSize * 2 };

}

function nextTeamColor() {
  var res = teamColors[nextTeamColorIdx];
  nextTeamColorIdx = (nextTeamColorIdx + 1) % teamColors.length;
  return res;
}

var ghostTeams = {'stick': [], 'stone': undefined};

function newGhost(team) {
  var g = new Ghost(ghostBounds, 0.0002);
  g.team = team;

  if(g.team == 'stone')
    g.stone = new Stone(new THREE.Vector3(g.x, g.y, 0), g.id, nextTeamColor());

  return g;
}

function onUserUpdate(newUsers, deletedUsers, otherUsers) {
  var users = newUsers.concat(otherUsers);
  var stickUsers = [], stoneUsers = [];

  // Update teams based on the users' positions
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if(border.pointOnBorder(user.x, user.y)) {
      // This user is inside the team border, and is thus
      // not really considered active.
      //console.log('user ' + id + ' (team ' + user.team + ') is inside the team border. removing.');

      deletedUsers.push(user);
      users.splice(i--, 1);
    }
    else {
      // User is inside the main playing area.
      if(!user.team) {
        // This user doesn't have a team. Give them one.
        user.team = border.closestTeamToPoint(user.x, user.y);
        //console.log('user ' + id + ' has joined team ' + user.team);
      }

      if(user.team == 'stick') {
        stickUsers.push(user);
      }
      else if(user.team == 'stone') {
        stoneUsers.push(user);

        // Make sure they have an actual Stone object
        if(!user.stone)
          user.stone = new Stone(new THREE.Vector3(user.x, user.y, 0), user.id, nextTeamColor());
      }
    }
  }

  // Ensure 3 stick endpoints
  var minSticks = 3;

  var neededGhosts = minSticks - stickUsers.length;
  var ghosts = ghostTeams.stick;
  for(var i = 0; i < neededGhosts; i++) {
    var ghost = ghosts[i];
    if (ghost)
      ghost.update();
    else
      ghosts[i] = ghost = newGhost('stick');
    stickUsers.push(ghost);
  }
  // Dispose of unnecessary stick ghosts
  deletedUsers.push.apply(deletedUsers, 
    ghosts.splice(Math.max(neededGhosts, 0)));


  // Ensure at least one stone
  var ghost = ghostTeams.stone;
  if(stoneUsers.length == 0) {
    if (ghost)
      ghost.update();
    else
      ghostTeams.stone = newGhost('stone');
  }
  else if (ghost) {
    // Remove unnecessary ghosts
    deletedUsers.push(ghost);
    ghostTeams.stone = undefined;
  }

  for(var i = 0; i < deletedUsers.length; i++) {
    var user = deletedUsers[i];
    if(user.stone) {
      user.stone.remove();
      user.stone = undefined;
    }
  }

  // Show circles for stick users
  context.userUpdate(stickUsers, deletedUsers);
}

function animate(floor) {
  var stickUsers = [], stoneUsers = [], stickVertices = [];
  var users = ghostTeams.stick.slice();
  if (ghostTeams.stone)
    users.push(ghostTeams.stone);
  for (var user of floor.users)
    if (!border.pointOnBorder(user.x, user.y))
      users.push(user);

  // Update users and their stones and collect teammates
  for(var user of users) {
    if(user.team == 'stone') {
      user.stone.position.set(user.x, user.y, 0);
      stoneUsers.push(user);
    }
    else if(user.team == 'stick') {
      stickUsers.push(user);
    }
  }

  // Now redraw sticks
  for(var i = 0; i < stickLines.length; i++)
    stickLines[i].remove();

  stickLines = [];

  for(var i = 0; i < stickUsers.length; i++) {
    var iStick = stickUsers[i];
    stickVertices.push(new THREE.Vector3(iStick.x, iStick.y, 0));

    for(var j = i + 1; j < stickUsers.length; j++) {
      var stickLine = new Stick(stickVertices[i],
        new THREE.Vector3(stickUsers[j].x, stickUsers[j].y, 0));

      stickLines.push(stickLine);
    }
  }

  // Update the sizes of the stones
  // Have to do this after we've updated the positions of all
  // these users' stones.... this is a bit of a mess. The more
  // logical thing to do would be to have new subclasses for
  // stick users and stone users...
  for(var i = 0; i < stoneUsers.length; i++)
    stoneUsers[i].stone.draw(stickVertices, stoneUsers);

  context.render();
}

export const behavior = {
  title: "Sticks and Stones",
  frameRate: 'sensors',
  userUpdate: onUserUpdate,
  init: init,
  render: animate
};
export default behavior;
