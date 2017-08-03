/* MoMath Math Square Behavior
 *
 *        Title: Sticks Stones Intersect
 *  Description: Draw a circle and line? Possibly development testing for sticks-stones
 * Scheduler ID: 
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *       Status: unknown
 */

import THREEContext from 'threectx';
import * as THREE from 'three';
import * as Display from 'display';
import {Ghost} from 'floor';

var context;

var circle = new THREE.Mesh(new THREE.SphereGeometry(100,100,100), new THREE.MeshBasicMaterial({color:0xdddddd, opacity:0.4}))
var line;

function init(container) {
  context = new THREEContext(container, true);

  container.addEventListener( 'mousemove', onDocumentMouseMove, false );

  circle.position.set(Display.width/2, Display.height/2, 0)
  context.scene.add(circle);

}

function makeNewGhosts(){
  for(var i=0;i<5;i++){
    var g = new Ghost(undefined, 0.0002);
    ghosts.push(g);
  }
}

function isIntersecting(a,b){
  var bX = b.x;
  var bY = b.y;
  var aX = a.x;
  var aY = a.y;
  var cX = circle.position.x;
  var cY = circle.position.y;
  var R = 100;

  var dX = bX - aX;
  var dY = bY - aY;
  if ((dX == 0) && (dY == 0)){
    // A and B are the same points, no way to calculate intersection
    return false;
  }

  var dl = (dX * dX + dY * dY);
  var t = ((cX - aX) * dX + (cY - aY) * dY) / dl;

  // point on a line nearest to circle center
  var nearestX = aX + t * dX;
  var nearestY = aY + t * dY;

  var nearest = new THREE.Vector3(nearestX,nearestY,0);
  var dist = circle.position.distanceTo(nearest);

  if (dist == R) {
    // line segment touches circle; one intersection point
    iX = nearestX;
    iY = nearestY;

    if (t < 0 || t > 1) {
      return true;
      // intersection point is not actually within line segment
    }
  } else if (dist < R) {
    // two possible intersection points

    var dt = Math.sqrt(R * R - dist * dist) / Math.sqrt(dl);

    // intersection point nearest to A
    var t1 = t - dt;
    //i1X = aX + t1 * dX;
    //i1Y = aY + t1 * dY;
    if (t1 < 0 || t1 > 1){
      // intersection point is not actually within line segment
      return false;
    }

    // intersection point farthest from A
    var t2 = t + dt;
    //i2X = aX + t2 * dX;
    //i2Y = aY + t2 * dY;
    if (t2 < 0 || t2 > 1) {
      // intersection point is not actually within line segment
      return false;
    } 
    return true;
  } else {
    return false;
    // no intersection
  }
}

//

function onDocumentMouseMove(event) {
  var st = new THREE.Vector3(event.offsetX, event.offsetY,0);
  var end = new THREE.Vector3(200, 40,0);
  var geo = new THREE.Geometry();
  geo.vertices.push(st);
  geo.vertices.push(end);
  if(line != undefined) context.scene.remove(line);
  line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:(isIntersecting(st,end)? 0xff0000: 0xffffff), linewidth:2}));
  context.scene.add(line);
}

//

function animate() {
  context.render();
}

export const behavior = {
  title: "Sticks Stones Intersect",
  frameRate: 'animate',
  maxUsers: null,
  init: init,
  render: animate
};
export default behavior;
