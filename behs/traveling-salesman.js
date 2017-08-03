/* MoMath Math Square Behavior
 *
 *        Title: Traveling salesman
 *  Description: Solve the traveling salesman problem with users
 * Scheduler ID: 7
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *       Status: works
 */

import THREEContext from 'threectx';
import * as THREE from 'three';
import * as Display from 'display';

var context;

var lines = [];
var shortestPairing = new Object();

function init(container) {
  context = new THREEContext(container);

  behavior.userUpdate = context.userUpdate.bind(context);
}

function isLeft(la, lb, c){
  return ((lb.x - la.x)*(c.y - la.y) - (lb.y - la.y)*(c.x - la.x)) > 0;
}

function createRandomPointsAndConnect(floor){
  for(var l of lines) context.scene.remove(l);
  lines = [];

  var points = new Array();
  for(var user of floor.users){
    var newPosition = new THREE.Vector3(user.x, user.y);
    points.push(newPosition);
  }

  // TODO: need some initial ghost creation to avoid this case?
  if(points.length == 0)
    return;             

  // Traveling Salesman
  // 1. get shortest initial connection

  var connectedPoints = new Array();

  var pointPairings = new Array();
  var firstTimeThrough = true;
  var allPointsConnected = false;

  while(!allPointsConnected){

    var shortestLength = 100000000000.0;
    var shortestWinnerRef = -1;


    // 2. iterate through connected points, looking for nearest neighbor, add nearest to connected set
    var connectedPointsSize = (firstTimeThrough ? points.length : connectedPoints.length);
    while(connectedPointsSize--){
      var thisConnectedPoint = (firstTimeThrough ? points[connectedPointsSize] : connectedPoints[connectedPointsSize]);


      var allPoints = points.length;
      // 3. get shortest connection
      while(allPoints--){
        var currentPoint = points[allPoints];
        var isAlreadyUsed = false;
        for(var p of connectedPoints) if(p == currentPoint) isAlreadyUsed = true;
        var isCrisCross = false;
        for(var c = 1; c < connectedPoints.length; c++){
            if(isLeft(connectedPoints[c],connectedPoints[c-1],currentPoint) == isLeft(connectedPoints[c],connectedPoints[c-1],thisConnectedPoint)) isCrisCross = true;
        }
        var connectState

        if(currentPoint != thisConnectedPoint && !currentPoint.connected && !isAlreadyUsed){
          var dist = currentPoint.distanceTo(thisConnectedPoint);
          if(dist < shortestLength /* && dist != 0 */){
            shortestPairing.start = thisConnectedPoint.clone();
            shortestPairing.end = currentPoint.clone();
            shortestWinnerRef = allPoints;
            shortestLength = dist;
          }
        } else {
          if(isCrisCross) continue;
        }
      }
      if(!firstTimeThrough) break;
    }

    if(shortestWinnerRef >= 0){
      var geometry = new THREE.Geometry();

      connectedPoints.push(points[shortestWinnerRef])

      points[shortestWinnerRef].connected = true;
      geometry.vertices.push(shortestPairing.start);
      geometry.vertices.push(shortestPairing.end);


      var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffff7D, linewidth: 2 } ) );
      lines.push(line);
      context.scene.add(line);

      firstTimeThrough = false;
    }

    allPointsConnected = (connectedPoints.length == points.length);
  }

  var geometry = new THREE.Geometry();
  geometry.vertices.push(connectedPoints[0]);
  geometry.vertices.push(connectedPoints[connectedPoints.length-1]);
  var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffff7D, linewidth: 2 } ) );
  lines.push(line);
  context.scene.add(line);
}

function animate(floor) {
  createRandomPointsAndConnect(floor);
  context.render();
}

export const behavior = {
  title: "Traveling Salesman",
  frameRate: 'sensors',
  numGhosts: 3,
  init: init,
  render: animate
};
export default behavior;
