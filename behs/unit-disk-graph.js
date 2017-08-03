/* MoMath Math Square Behavior
 *
 *        Title: Unit Disk Graph
 *  Description: Draw lines between users within a given radius of each other
 * Scheduler ID: 18
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *       Status: works?
 */

import THREEContext from 'threectx';
import * as THREE from 'three';
import * as Display from 'display';

var context;

var shortestPairing = new Object();
var lines = new Array();

function init(container) {
  context = new THREEContext(container);

  behavior.userUpdate = context.userUpdate.bind(context);
}

function createRandomPointsAndConnect(floor){
  // particles
  var COMMUNICATION_RANGE = 150;
  var DIST_MAX = 4 * 100 * 100;

  // remove the old lines - clear the screen
  for(var l of lines) context.scene.remove(l);
  lines = [];

  // add a point for users or random points
  var points = new Array();
  for(var user of floor.users){
    var newPosition = new THREE.Vector3(user.x, user.y);
    points.push(newPosition);
  }

  // TODO: need some initial ghost creation to avoid this case?
  if(points.length == 0)
    return;

  // if there are fewer than 5 points, draw a unit-disk graph.
  if(points.length <= 6) {
    // connect all points that are closer that a fixed distance
    for(var i = 0; i < points.length; i++) {
      var currentPoint = points[i];
      for (var j = 0; j < i; j++) {
        var otherPoint = points[j];
        var dist = currentPoint.distanceTo(otherPoint);
        console.log("distance ", i, "," , j, " dist=", dist);
        if((dist < COMMUNICATION_RANGE) && (dist != 0)){
          shortestPairing.start = currentPoint.clone();
          shortestPairing.end = otherPoint.clone();
          var geometry = new THREE.Geometry();
          geometry.vertices.push(shortestPairing.start);
          geometry.vertices.push(shortestPairing.end);

          var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xe0e0e0, linewidth: 2 } ) );
          context.scene.add(line);
          lines.push(line);
        }
      }
    }
  } else {
    // draw a spanning tree instead
    var pointsBlack = new Array();

    // Find the min x/y point
    var distMin = DIST_MAX;
    var originPoint = new THREE.Vector3(0, 0);
    var idxMin = 0;
    for (var i = 0; i < points.length; i++) {
      var dist = originPoint.distanceTo(points[i]);
      if (dist < distMin) {
        distMin = dist;
        idxMin = i;
      }
    }
    var pointsGrey = points.splice(idxMin, 1);

    while (pointsGrey.length > 0) {
      // get the first point from the grey list, 
      var currentPoint = pointsGrey[0];
      // and add it to the black ist,
      pointsBlack.push(currentPoint);
      // and remove this point from the grey list.
      pointsGrey.splice(0, 1);

      // find all nbrs of the the current grey robot.  color them grey, and draw the edges
      for (var j = 0; j < points.length; j++) {
        var otherPoint = points[j];
        var dist = currentPoint.distanceTo(otherPoint);
        // console.log("distance ", i, "," , j, " dist=", dist);
        if((dist < COMMUNICATION_RANGE) && (dist != 0)){
          // This is a neighbor of the current grey robot.
          // remove from white list, add to grey list
          points.splice(j, 1);
          pointsGrey.push(otherPoint);

          // draw a tree line
          shortestPairing.start = currentPoint.clone();
          shortestPairing.end = otherPoint.clone();
          var geometry = new THREE.Geometry();
          geometry.vertices.push(shortestPairing.start);
          geometry.vertices.push(shortestPairing.end);

          var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xfe3434, linewidth: 2 } ) );
          context.scene.add(line);
          lines.push(line);
        }
      }
    } 
  }

}

function animate(floor) {
  createRandomPointsAndConnect(floor);
  context.render();
}

export const behavior = {
  title: "Unit Disk Graph",
  frameRate: 'sensore',
  numGhosts: 2,
  init: init,
  render: animate
};
export default behavior;
