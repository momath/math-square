/* MoMath Math Square Behavior
 *
 *        Title: Shape Blaster
 *  Description: Combine user shapes to form larger shapes
 * Scheduler ID: 1
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *       Status: unknown, partially working
 */

import * as Display from 'display';
import THREEContext from 'threectx';
import {teamColors} from 'threectx';
import * as THREE from 'three';
import {Ghost} from 'floor';
import TeamBorder from 'lib/teamborder';

var BlasterShape = (function() {
  var counter = 0,
    extrudeOptions = { amount: 10 };

  // The extra width added to the distance between the users when drawing
  // the shape (where 'width' is along a line between the users and
  // 'height' is perpendicular to that line).
  var widthPadding = 30;

  // The height for shapes involving two users.
  var heightForTwoUsers = widthPadding;

  // Minimum height for shapes involving three users
  var minHeightForThreeUsers = 70;

  // Minimum radius for the star that's drawn with >= 4 users
  var minRadiusForFourPlus = 40;

  function BlasterShape(scene) {
    this.id = counter++;
    this.usersByID = {};
    this.userCount = 0;

    this._scene = scene;
    this._singleUserTeamAtLastDraw = undefined;
  }

  BlasterShape.prototype.addUser = function(user) {
    if(user.shape != this) {
      if(user.shape)
        user.shape.removeUser(user);

      this.usersByID[user.id] = user;
      user.shape = this;
      this.userCount++;
    }
    //else
    //    console.log('user ' + user.id + ' added to shape ' + this.id + ', but it is already a member');
  };

  BlasterShape.prototype.removeUser = function(user) {
    if(user.shape == this) {
      delete this.usersByID[user.id];
      user.shape = undefined;
      this.userCount--;

      if(this.userCount == 0)
        this.remove();
    }
    //else
    //    console.log('user ' + user.id + ' removed from shape ' + this.id + ', but it is not a member');
  };

  BlasterShape.prototype.remove = function() {
    if(this._node) {
      this._scene.remove(this._node);
      this._node = undefined;
    }
  };

  BlasterShape.prototype.draw = function() {
    switch(this.userCount) {
      case 0: this.remove(); break;
      case 1: drawOne.call(this); break;
      case 2: drawTwo.call(this); break;
      case 3: drawThree.call(this); break;
      default: drawFourPlus.call(this); break;
    }

    if(this.userCount == 1)
      this._singleUserTeamAtLastDraw = this.usersByID[Object.keys(this.usersByID)[0]].team;
    else
      this._singleUserTeamAtLastDraw = undefined;
  };

  function drawOne() {
    var user = this.usersByID[Object.keys(this.usersByID)[0]],
      sides;

    // If there was only one user in the last draw cycle, and it matches
    // the team of our current user, just move our existing node into place.
    if(this._singleUserTeamAtLastDraw == user.team) {
      this._node.position.set(user.x, user.y, 0);
      return;
    }

    // Otherwise, start from scratch
    this.remove();

    switch(user.team) {
      case 'circle':
        sides = 45;
        break;

      case 'square':
        sides = 4;
        break;

      case 'triangle':
        sides = 3;
        break;
    }

    this._node = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 1, sides, 1, false),
      new THREE.MeshBasicMaterial({ color: user.color }));
    this._node.rotation.x = Math.PI / 2;
    this._node.rotation.y = 2 * Math.PI * Math.random();

    this._node.position.set(user.x, user.y, 0);
    this._scene.add(this._node);
  }

  function nodeForTwoUsers(user1, user2, teams, height, color) {
    var d = dist(user1, user2),
      avgPt = { x: (user1.x + user2.x) / 2, y: (user1.y + user2.y) / 2 },
      angle = angleBetween(user1, user2),
      s = new THREE.Shape();

    // We have to draw centered on the origin, so rotation works correctly.
    // These are the origins for that, assuming you'll be drawing full
    // width and height.
    var oX = -(d + widthPadding) / 2,
      oY = -height / 2;

    // We draw the shapes in some predetermined direction, so we need to
    // rotate the ones that aren't symmetric based on which shape is on
    // the left. This isn't accurate in the case of three users (in that
    // situation, the users we were passed may not even match up with the
    // teams array), so we kind of just have undefined behavior then.
    var leftmostTeam = (user1.x < user2.x) ? user1.team : user2.team;

    switch(teams) {
      case 'circle-circle':
        // ellipse
        s.absellipse(0, 0, (d + widthPadding) / 2, height / 2, 0, 2 * Math.PI);
        break;

      case 'circle-square':
        // one side flat, the other rounded
        s.moveTo(oX, oY);
        s.lineTo(oX, oY + height);
        s.lineTo(oX + d + widthPadding / 2, oY + height);
        s.ellipse(0, -height / 2,
          widthPadding / 2, height / 2,
          -Math.PI / 2, Math.PI / 2, false);
        s.lineTo(oX, oY);

        if(leftmostTeam == 'circle')
          angle -= Math.PI;
        break;

      case 'circle-triangle':
        // one side rounded, the other triangular

        s.moveTo(oX + widthPadding / 2, oY);
        s.ellipse(0, height / 2,
          widthPadding / 2, height / 2,
          Math.PI / 2, 1.5 * Math.PI, false);
        s.lineTo(oX + d + widthPadding / 2, oY + height);
        s.lineTo(oX + d + widthPadding, oY + height / 2);
        s.lineTo(oX + d + widthPadding / 2, oY);
        s.lineTo(oX + widthPadding / 2, oY);

        if(leftmostTeam == 'triangle')
          angle -= Math.PI;
        break;

      case 'square-square':
        // rectangle

        s.moveTo(oX, oY);
        s.lineTo(oX, oY + height);
        s.lineTo(oX + d + widthPadding, oY + height);
        s.lineTo(oX + d + widthPadding, oY);
        s.lineTo(oX, oY);
        break;

      case 'square-triangle':
        // pentagon

        s.moveTo(oX, oY);
        s.lineTo(oX, oY + height);
        s.lineTo(oX + d + widthPadding / 2, oY + height);
        s.lineTo(oX + d + widthPadding, oY + height / 2);
        s.lineTo(oX + d + widthPadding / 2, oY);
        s.lineTo(oX, oY);

        if(leftmostTeam == 'triangle')
          angle -= Math.PI;
        break;

      case 'triangle-triangle':
        // parallelogram

        s.moveTo(oX + widthPadding / 2, oY);
        s.lineTo(oX, oY + height);
        s.lineTo(oX + d + widthPadding / 2, oY + height);
        s.lineTo(oX + d + widthPadding, oY);
        s.lineTo(oX + widthPadding / 2, oY);
        break;
    }

    var geom = new THREE.ExtrudeGeometry(s, extrudeOptions),
      node = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: color }));

    node.rotation.z = angle;
    node.position.set(avgPt.x, avgPt.y, 0);

    return node;
  }

  function drawTwo() {
    var userIDs = Object.keys(this.usersByID),
      user1 = this.usersByID[userIDs[0]],
      user2 = this.usersByID[userIDs[1]],
      teams = [user1.team, user2.team].sort().join('-'),
      color = averageColors([user1.color, user2.color]);

    this.remove();

    this._node = nodeForTwoUsers(user1, user2, teams, heightForTwoUsers, color);
    this._scene.add(this._node);
  }

  function drawThree() {
    var userIDs = Object.keys(this.usersByID),
      user1 = this.usersByID[userIDs[0]],
      user2 = this.usersByID[userIDs[1]],
      user3 = this.usersByID[userIDs[2]],
      teams = [user1.team, user2.team, user3.team].sort().join('-'),
      color = averageColors([user1.color, user2.color, user3.color]);

    switch(teams) {
      case 'circle-circle-circle':
        teams = 'circle-circle';
        break;

      case 'circle-circle-square':
        teams = 'circle-square';
        break;

      case 'circle-circle-triangle':
        teams = 'circle-triangle';
        break;

      case 'circle-square-square':
        teams = 'circle-square';
        break;

      case 'circle-square-triangle':
        // The word from on high is weird about this one. TODO.
        teams = 'circle-triangle';
        break;

      case 'circle-triangle-triangle':
        teams = 'circle-triangle';
        break;

      case 'square-square-square':
        teams = 'square-square';
        break;

      case 'square-square-triangle':
        teams = 'square-triangle';
        break;

      case 'square-triangle-triangle':
        teams = 'square-triangle';
        break;

      case 'triangle-triangle-triangle':
        teams = 'triangle-triangle';
        break;
    }

    var d1_2 = dist2(user1, user2),
      d1_3 = dist2(user1, user3),
      d2_3 = dist2(user2, user3),
      dmax = Math.max(d1_2, d1_3, d2_3),
      u1, u2, u3, height;

    // Find the users who are farthest apart. Those two users determine
    // the 'width' of the shape (and are thus passed off to nodeForTwoUsers).
    // The other user is used to find the 'height', but finding how far
    // he is from the line between the other two.
    if(d1_2 == dmax) {
      u1 = user1;
      u2 = user2;
      u3 = user3;
    }
    else if(d1_3 == dmax) {
      u1 = user1;
      u2 = user3;
      u3 = user2;
    }
    else {
      u1 = user2;
      u2 = user3;
      u3 = user1;
    }

    this.remove();
    height = Math.max(distToSegment(u3, u1, u2), minHeightForThreeUsers);
    this._node = nodeForTwoUsers(u1, u2, teams, height, color);

    // The nodeForTwoUsers function centers on the average of the passed-in
    // users, but we want to center on all three.
    var avgX = (user1.x + user2.x + user3.x) / 3,
      avgY = (user1.y + user2.y + user3.y) / 3;

    this._node.position.set(avgX, avgY, 0);

    this._scene.add(this._node);
  }

  function drawFourPlus() {
    // A big 7-pointed regular star

    var userIDs = Object.keys(this.usersByID),
      maxDist2 = minRadiusForFourPlus * minRadiusForFourPlus,
      center = {x: 0, y: 0}, radius,
      color, colors = [];

    // Find the center of all of our users:
    for(var i = 0; i < userIDs.length; i++) {
      var user = this.usersByID[userIDs[i]];
      center.x += user.x;
      center.y += user.y;
      colors.push(user.color);
    }

    center.x /= userIDs.length;
    center.y /= userIDs.length;

    color = averageColors(colors);

    // Now find the maximum distance from the center to any given user.
    // This will be our radius.
    for(var i = 0; i < userIDs.length; i++) {
      var user = this.usersByID[userIDs[i]],
        d2 = dist2(center, user);

      if(d2 > maxDist2)
        maxDist2 = d2;
    }

    radius = Math.sqrt(maxDist2);

    // And now the draw the star
    var numStarPoints = 9,  // This needs to be odd
      angleDelta = (2 * Math.PI) / numStarPoints,
      position = 0,
      points = [];

    // Connect every second point of the star along a circle of the given
    // radius:
    for(var i = 0; i < numStarPoints; i++) {
      var angle = position * angleDelta,
        x = radius * Math.sin(angle),
        y = radius * Math.cos(angle);

      points.push(new THREE.Vector2(x, y));

      position = (position + 2) % numStarPoints;
    }

    // Close the path. Probably not necessary
    points.push(points[0].clone());

    this.remove();

    var shape = new THREE.Shape(points),
      geom = new THREE.ExtrudeGeometry(shape, extrudeOptions);

    // TODO: three.js has serious trouble triangulating these shapes,
    // probably due to the overlapping line segments they define. This
    // creates a ton of log messages and doesn't quite draw the star
    // properly. It's much less noticeable with a 9-pointed star than with
    // a 7-pointed one, so for now I'm just changing that and ignoring.

    this._node = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: color }));

    this._node.position.set(center.x, center.y, 0);
    this._scene.add(this._node);
  }

  function dist2(user1, user2) {
    var dx = user1.x - user2.x,
      dy = user1.y - user2.y;

    return dx * dx + dy * dy;
  }

  function dist(user1, user2) {
    var dx = user1.x - user2.x,
      dy = user1.y - user2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if(l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if(t < 0) return dist2(p, v);
    if(t > 1) return dist2(p, w);
    return dist2(p, { x: v.x + t * (w.x - v.x),
      y: v.y + t * (w.y - v.y) });
  }

  function distToSegment(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
  }

  function angleBetween(user1, user2) {
    // While atan2 is usually the Right Decision, it attempts to compensate
    // for quadrants in a way that's not quite right for us. We manually
    // correct the angles in nodeForTwoUsers().
    return Math.atan((user1.y - user2.y) / (user1.x - user2.x));
  }

  function rgbToXYZ(rgb) {
    var var_R = ((rgb & 0xff0000) >> 16) / 255,
      var_G = ((rgb & 0x00ff00) >> 8) / 255,
      var_B = (rgb & 0x0000ff) / 255;

    if ( var_R > 0.04045 ) var_R = Math.pow(( ( var_R + 0.055 ) / 1.055 ), 2.4);
    else                   var_R = var_R / 12.92;
    if ( var_G > 0.04045 ) var_G = Math.pow(( ( var_G + 0.055 ) / 1.055 ), 2.4);
    else                   var_G = var_G / 12.92;
    if ( var_B > 0.04045 ) var_B = Math.pow(( ( var_B + 0.055 ) / 1.055 ), 2.4);
    else                   var_B = var_B / 12.92;

    var_R = var_R * 100;
    var_G = var_G * 100;
    var_B = var_B * 100;

    //Observer. = 2°, Illuminant = D65
    return { x: var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805,
      y: var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722,
      z: var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505 };
  }

  function xyzToLab(xyz) {
    // Observer= 2°, Illuminant= D65
    var var_X = xyz.x / 95.047,
      var_Y = xyz.y / 100.000,
      var_Z = xyz.z / 108.883;

    if ( var_X > 0.008856 ) var_X = Math.pow(var_X, ( 1/3 ));
    else                    var_X = ( 7.787 * var_X ) + ( 16 / 116 );
    if ( var_Y > 0.008856 ) var_Y = Math.pow(var_Y, ( 1/3 ));
    else                    var_Y = ( 7.787 * var_Y ) + ( 16 / 116 );
    if ( var_Z > 0.008856 ) var_Z = Math.pow(var_Z, ( 1/3 ));
    else                    var_Z = ( 7.787 * var_Z ) + ( 16 / 116 );

    return { L: ( 116 * var_Y ) - 16,
      a: 500 * ( var_X - var_Y ),
      b: 200 * ( var_Y - var_Z ) };
  }

  function LabToXYZ(lab) {
    var var_Y = ( lab.L + 16 ) / 116,
      var_X = lab.a / 500 + var_Y,
      var_Z = var_Y - lab.b / 200;

    var var_Y3 = var_Y * var_Y * var_Y,
      var_X3 = var_X * var_X * var_X,
      var_Z3 = var_Z * var_Z * var_Z;

    if ( var_Y3 > 0.008856 ) var_Y = var_Y3;
    else                      var_Y = ( var_Y - 16 / 116 ) / 7.787;
    if ( var_X3 > 0.008856 ) var_X = var_X3;
    else                      var_X = ( var_X - 16 / 116 ) / 7.787;
    if ( var_Z3 > 0.008856 ) var_Z = var_Z3;
    else                      var_Z = ( var_Z - 16 / 116 ) / 7.787;

    // Observer= 2°, Illuminant= D65
    return { x: 95.047 * var_X,
      y: 100.000 * var_Y,
      z: 108.883 * var_Z };
  }

  function xyzToRGB(xyz) {
    var var_X = xyz.x / 100,        //X from 0 to  95.047      (Observer = 2°, Illuminant = D65)
      var_Y = xyz.y / 100,        //Y from 0 to 100.000
      var_Z = xyz.z / 100;        //Z from 0 to 108.883

    var var_R = var_X *  3.2406 + var_Y * -1.5372 + var_Z * -0.4986;
    var var_G = var_X * -0.9689 + var_Y *  1.8758 + var_Z *  0.0415;
    var var_B = var_X *  0.0557 + var_Y * -0.2040 + var_Z *  1.0570;

    if ( var_R > 0.0031308 ) var_R = 1.055 * Math.pow( var_R, ( 1 / 2.4 ) ) - 0.055;
    else                     var_R = 12.92 * var_R;
    if ( var_G > 0.0031308 ) var_G = 1.055 * Math.pow( var_G, ( 1 / 2.4 ) ) - 0.055;
    else                     var_G = 12.92 * var_G;
    if ( var_B > 0.0031308 ) var_B = 1.055 * Math.pow( var_B, ( 1 / 2.4 ) ) - 0.055;
    else                     var_B = 12.92 * var_B;

    var R = Math.floor(var_R * 255),
      G = Math.floor(var_G * 255),
      B = Math.floor(var_B * 255);

    return (R << 16) | (G << 8) | B;
  }

  function averageColors(colors) {
    var lab = { L: 0, a: 0, b: 0 };
    for(var i = 0; i < colors.length; i++) {
      var ilab = xyzToLab(rgbToXYZ(colors[i]));
      lab.L += ilab.L;
      lab.a += ilab.a;
      lab.b += ilab.b;
    }

    lab.L /= colors.length;
    lab.a /= colors.length;
    lab.b /= colors.length;

    return xyzToRGB(LabToXYZ(lab));
  }

  return BlasterShape;
})();

var context;
var border;

// notes
// 2:1 ratio should be switched to direct mapping/stretching
// range should be in the 50ish range
// range between feet should not exceed 36
// person should probably live within 30 pixels
// block zones should be at 24 to fit within a led block

var mergeDistance = 80,
  mergeDist2 = mergeDistance * mergeDistance;

var ghostBounds;
var shapesByID = {};
var colorIdx = 5;

// debug things. should be false for production
var showUserSpheres = false;

var particleSystem;


function init(container) {
  context = new THREEContext(container);

  var borderTileSize = 24;
  border = new TeamBorder(Display.width, borderTileSize, [
    { name: 'circle', image: 'images/circle.png' },
    { name: 'square', image: 'images/rect.png' },
    { name: 'triangle', image: 'images/triangle.png' }
  ]);
  border.addToScene(context.scene);

  ghostBounds = { x: borderTileSize, y: borderTileSize,
    width: Display.width - borderTileSize * 2,
    height: Display.height - borderTileSize * 2 };

  /////////


  // create the particle variables
  var particleCount = 1800,
    particles = new THREE.Geometry(),
    pMaterial =
    new THREE.ParticleBasicMaterial({
      color: 0x333333,
      size: 10
    });

  // now create the individual particles
  for(var p = 0; p < particleCount; p++) {

    // create a particle with random
    // position values, -250 -> 250
    var pX = Math.random() * 500 - 250,
      pY = Math.random() * 500 - 250,
      pZ = 500,
      particle = new THREE.Vector3(pX, pY, pZ);

    particle.velocity = new THREE.Vector3(Math.random()*5,Math.random()*5,Math.random()*1);

    // add it to the geometry
    particles.vertices.push(particle);
  }

  // create the particle system
  particleSystem =
    new THREE.ParticleSystem(
      particles,
      pMaterial);

  // add it to the scene
  context.scene.add(particleSystem);

  ////////

}

var ghostTeams = {};

function ghostTeam(team) {
  var g = ghostTeams[team];
  if (g)
    return g;
  g = new Ghost(ghostBounds, 0.0006);
  g.team = team;
  g.color = nextColor();
  ghostTeams[team] = g;
}

// These three functions just wrap the BlasterShape methods to keep
// shapesByID up to date. They're probably kind of unnecessary,
// since we walk all shapes in animate anyway.... OH WELL LOL
function addUserToShapeOfUser(joiner, captain) {
  if(!captain.shape)
    newShapeForUser(captain);

  if(joiner.shape != captain.shape) {
    if(joiner.shape)
      removeUserFromShape(joiner);

    captain.shape.addUser(joiner);
  }
}

function removeUserFromShape(user) {
  var shape = user.shape;
  if(shape) {
    shape.removeUser(user);
    if(shape.userCount == 0) {
      //console.log('deleting shape ' + shape.id + '; it has no users');
      delete shapesByID[shape.id];
    }
  }
}

function newShapeForUser(user) {
  var shape = new BlasterShape(context.scene);
  shape.addUser(user);
  shapesByID[shape.id] = shape;
}


function onUserUpdate(newUsers, deletedUsers, otherUsers) {
  var usersByTeam = {
    circle: [],
    square: [],
    triangle: []
  };

  var users = newUsers.concat(otherUsers);

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

      usersByTeam[user.team].push(user);

      // Give new users colors
      if (!('color' in user))
        user.color = nextColor();
    }
  }

  // Remove any deleted users from their shapes
  for(var i = 0; i < deletedUsers.length; i++)
    removeUserFromShape(deletedUsers[i]);

  // Ensure at least one user of each team
  for(var team in usersByTeam) {
    var g = ghostTeams[team];
    if(usersByTeam[team].length == 0) {
      if (g) {
        g.update();
        otherUsers.push(g);
      } else
        newUsers.push(ghostTeam(team));
    } else if (g) {
      // Remove unnecessary ghosts
      delete ghostTeams[team];
      removeUserFromShape(g);
      deletedUsers.push(g);
    }
  }

  if (showUserSpheres)
    context.userUpdate(newUsers, deletedUsers, otherUsers);
}

// Square of distance between two points (to save the sqrt)
function dist2(x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  return dx * dx + dy * dy;
}

function usersShouldMerge(captain, potentialJoiner) {
  return dist2(captain.x, captain.y, potentialJoiner.x, potentialJoiner.y) <= mergeDist2;
}

function animate(floor) {
  var sortedUsers = [];
  for (var user of floor.users)
    if (!border.pointOnBorder(user.x, user.y))
      sortedUsers.push(user);
  for (var gt in ghostTeams)
    sortedUsers.push(ghostTeams[gt]);
  sortedUsers.sort(function (a, b) { return a.id - b.id; });

  var
    mergeableUsersByID = {},
    markedShapeIDs = {};

  // Assemble a list of users that are candidates for merging.
  // This includes:
  // - singletons
  // - the designated user of each shape (which for now is just
  // the first member of that shape we encounter when walking
  // the user IDs in sorted order)

  for(var user of sortedUsers) {
    // Have we already handled this user? (Probably in breaking
    // apart another shape).
    if(mergeableUsersByID.hasOwnProperty(user.id))
      continue;

    // Singletons
    if(!user.shape) {
      mergeableUsersByID[user.id] = user;
      continue;
    }

    // Have we already met this user's shape? If so we already
    // have a designated user for it and this user is inconsequential.
    if(markedShapeIDs[user.shape.id])
      continue;

    // Singletons, take two
    if(user.shape.userCount == 1) {
      markedShapeIDs[user.shape.id] = true;
      mergeableUsersByID[user.id] = user;
      continue;
    }

    // Alright, now we have a never-before-seen shape with
    // more than one user. The current user is the designated
    // user for it:
    markedShapeIDs[user.shape.id] = true;
    mergeableUsersByID[user.id] = user;

    // Now let's see if we can break apart any of its members
    for(var shapeUserID in user.shape.usersByID) {
      var shapeUser = user.shape.usersByID[shapeUserID];

      if(shapeUser == user)
        continue;

      if(!usersShouldMerge(user, shapeUser)) {
        // Too far away; remove it from the shape and designate it as a new singleton
        //console.log('user ' + shapeUser.id + ' is leaving the shape of user ' + user.id);
        removeUserFromShape(shapeUser);
        mergeableUsersByID[shapeUser.id] = shapeUser;
      }
    }
  }


  // Now, merge users
  for(var captain of sortedUsers) {
    // Did we already merge this user?
    if(!mergeableUsersByID.hasOwnProperty(captain.id))
      continue;

    // See what mergeable users are close enough to our captain
    for(var id in mergeableUsersByID) {
      var potentialJoiner = mergeableUsersByID[id];

      if(potentialJoiner == captain)
        continue;

      if(usersShouldMerge(captain, potentialJoiner)) {
        //console.log('user ' + potentialJoiner.id + ' is joining the shape of user ' + captain.id);
        addUserToShapeOfUser(potentialJoiner, captain);
        delete mergeableUsersByID[potentialJoiner.id];

        // Remove the captain from the unmerged list, in case this was his first joiner
        delete mergeableUsersByID[captain.id];
      }
    }
  }

  // Give new shapes to all of the leftover guys, if need be
  for(var id in mergeableUsersByID) {
    var user = mergeableUsersByID[id];
    if(!user.shape)
      newShapeForUser(user);
  }


  // And finally, draw everything
  for(var id in shapesByID)
    shapesByID[id].draw();


  var pCount = particleSystem.geometry.vertices.length;
  while(pCount--) {

    // get the particle
    var particle = particleSystem.geometry.vertices[pCount];

    // check if we need to reset
    if(particle.y < -200 || particle.x < -200 || particle.y > Display.height || particle.x > Display.width) {
      particle.y = Display.height;
      particle.x = Math.random()*200;
      particle.velocity.y = 0;
    }

    // update the velocity with
    // a splat of randomniz
    particle.velocity.y -= Math.random() * .1;

    // and the position
    particle.add(particle.velocity);
  }



  particleSystem.geometry.verticesNeedUpdate = true;
  particleSystem.geometry.__dirtyVertices = true;

  context.render();
}

function angleBetween(v1, v2) {
  return Math.atan((v2.y - v1.y) / (v2.x - v1.x));
}

function nextColor() {
  var color = teamColors[colorIdx];
  colorIdx = (colorIdx + 1) % teamColors.length;
  return color;
}

export const behavior = {
  title: "Shape Blaster",
  frameRate: 'animate',
  userUpdate: onUserUpdate,
  init: init,
  render: animate
};
export default behavior;
