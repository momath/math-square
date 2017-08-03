/* MoMath Math Square Behavior
 *
 *        Title: Debug
 *  Description: Display user blobs and sensors
 * Scheduler ID: 0
 *    Framework: THREE
 *       Author: Dylan Simon <dylan@dylex.net>
 *      Created: 2017-03-11
 *      Updated: 2017-04-11 to add sensors
 *       Status: works
 */

import {Behavior} from 'behavior';
import * as Display from 'display';
import THREEContext from 'threectx';
import {Index} from 'sensors';
import Floor from 'floor';
import * as THREE from 'three';

var three: THREEContext;
var sensors: THREE.Mesh[] = [];

function init(container: HTMLDivElement) {
  three = new THREEContext(container);
  /* display user spheres */
  behavior.userUpdate = three.userUpdate.bind(three);
}

function render(floor: Floor) {
  var s;
  /* remove all displayed sensors from last time */
  while (s = sensors.pop())
    three.scene.remove(s);
  /* add all active sensors to the scene */
  for (var i: Index|undefined = new Index(); i; i = i.incr()) {
    if (floor.sensors.get(i)) {
      s = new THREE.Mesh(new THREE.CircleGeometry(Display.sensorWidth/2, 4, Math.PI/4), new THREE.MeshBasicMaterial({color:0x888888}));
      var p = Display.fromSensor(i);
      s.position.set(p.x, p.y, 0);
      s.lookAt(new THREE.Vector3(p.x, p.y, -10));
      sensors.push(s);
      three.scene.add(s);
    }
  }

  /* always call this at the end of render to update the display */
  three.render();
}

export const behavior: Behavior = {
  title: "Sensor Debug (THREE)",
  numGhosts: 4,
  frameRate: 'sensors',
  init: init,
  render: render
};
export default behavior
