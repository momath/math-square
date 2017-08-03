/* MoMath Math Square Behavior
 *
 *        Title: Spanning Tree
 *  Description: Construct a minimum spanning tree between users
 * Scheduler ID: 6
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *      Updated: 2017-04 for SDK by dylan
 *       Status: works
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

  for(var l in lines) context.scene.remove(lines[l]);
  lines = [];

  var points = new Array();
  for(var user of floor.users){
    var newPosition = new THREE.Vector3(user.x, user.y);
    points.push(newPosition);
  }

  // TODO: need some initial ghost creation to avoid this case?
  if(points.length == 0)
    return;

  // Prim's Algorithm
  // 1. get random starting position, add as connected point

  var connectedPoints = new Array();
  var pointPairings = new Array();
  var startingPoint = points[Math.floor(Math.random() * points.length)];
  startingPoint.connected = true;
  connectedPoints.push(startingPoint);

  var allPointsConnected = false;

  while(!allPointsConnected){

    var shortestLength = 100000000000.0;
    var shortestWinnerRef = -1;


    // 2. iterate through connected points, looking for nearest neighbor, add nearest to connected set
    var connectedPointsSize = connectedPoints.length;
    while(connectedPointsSize--){
      var thisConnectedPoint = connectedPoints[connectedPointsSize];


      var allPoints = points.length;
      // 3. get shortest connection
      while(allPoints--){
        var currentPoint = points[allPoints];
        if(currentPoint != thisConnectedPoint && !currentPoint.connected){
          var dist = currentPoint.distanceTo(thisConnectedPoint);
          if(dist < shortestLength/* && dist != 0*/){
            shortestPairing.start = thisConnectedPoint.clone();
            shortestPairing.end = currentPoint.clone();
            shortestWinnerRef = allPoints;
            shortestLength = dist;
          }
        }
      }

    }

    if(shortestWinnerRef >= 0){
      var geometry = new THREE.Geometry();

      connectedPoints.push(points[shortestWinnerRef])

      points[shortestWinnerRef].connected = true;
      geometry.vertices.push(shortestPairing.start);
      geometry.vertices.push(shortestPairing.end);

      var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffff7D, linewidth: 2 } ) );
      context.scene.add(line);
      lines.push(line);
    }

    allPointsConnected = (connectedPoints.length == points.length);
  }
}

function animate(floor) {
  createRandomPointsAndConnect(floor);
  context.render();
}


export const behavior = {
  title: "Minimum Spanning Tree",
  frameRate: 'sensors',
  numGhosts: 2,
  init: init,
  render: animate
};
export default behavior;
