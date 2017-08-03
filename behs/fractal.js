/* MoMath Math Square Behavior
 *
 *        Title: Fractal
 *  Description: Render dragon curve fractals whereever users are standing
 * Scheduler ID: 5
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *      Updated: 2017-04 for SDK by dylan
 *       Status: works
 */

import * as Display from 'display';
import THREEContext from 'threectx';
import {teamColors} from 'threectx';
import * as THREE from 'three';

var context;

function Fractal(_x,_y){
  this.iteration = 0;
  this.maxIterations = 12;
  this.progress = 0;
  this.direction = 1;
  this.startRotation = Math.random() * 2 * Math.PI;

  this.material = new THREE.LineBasicMaterial({linewidth:2, vertexColors:true});

  this.color1 = teamColors[Math.floor(Math.random() * teamColors.length)];
  do {
    this.color2 = teamColors[Math.floor(Math.random() * teamColors.length)];
  } while(this.color2 == this.color1);

  this.geo = new THREE.Geometry();
  this.lastDirection = "right";
  this.firstPosition = new THREE.Vector3(0,0,0);
  this.lastPosition = this.firstPosition.clone();
  this.fLine = new THREE.Line(this.geo, this.material);
  this.distanceSegment = 150;
  this.x = _x;
  this.y = _y;
  this.stop = false;

  if(!Fractal.prototype.dragonRules)
  {
    Fractal.prototype.dragonRules = [true];

    for(var j = 0; j <= this.maxIterations; j++) {
      var dragonButt = [];

      for(var i=0;i<Fractal.prototype.dragonRules.length;i++){
        dragonButt.push(!Fractal.prototype.dragonRules[i]);
      }

      Fractal.prototype.dragonRules.push(true);
      for(var i=dragonButt.length-1;i>=0;i--){
        Fractal.prototype.dragonRules.push(dragonButt[i]);
      }
    }
  }
}

Fractal.prototype.colorForSegment = function(i, numSegments)
{
  var segmentProgress = i / numSegments;

  // Fade to the second color in the middle, then back out to the first color
  if(segmentProgress > 0.5)
    segmentProgress = 1 - (segmentProgress - 0.5) * 2;
  else
    segmentProgress *= 2;

  var r1 = (this.color1 & 0xff0000) >> 16,
    g1 = (this.color1 & 0x00ff00) >> 8,
    b1 = (this.color1 & 0x0000ff),
    r2 = (this.color2 & 0xff0000) >> 16,
    g2 = (this.color2 & 0x00ff00) >> 8,
    b2 = (this.color2 & 0x0000ff);

  var r = r1 + (r2 - r1) * segmentProgress,
    g = g1 + (g2 - g1) * segmentProgress,
    b = b1 + (b2 - b1) * segmentProgress;

  return new THREE.Color((r << 16) | (g << 8) | b);
}

Fractal.prototype.iterate = function(){
  this.iteration = this.iteration + (this.direction == 1 ?  1 : -1);
  if(this.iteration <= 0) {
    context.scene.remove(this.fLine);
    this.stop = true;
    this.direction = 1;
  }
  if(this.iteration >= this.maxIterations) this.direction = 0;
  if(!this.stop) this.draw();
}

Fractal.prototype.draw = function(){
  this.geo = new THREE.Geometry();
  context.scene.remove(this.fLine);


  // There are 2^i line segments at iteration i
  var numSegments = 1 << this.iteration;

  // Add the initial rightward segment
  this.geo.vertices.push(this.firstPosition);
  this.geo.colors.push(this.colorForSegment(0, numSegments));
  this.lastPosition = this.firstPosition.clone();
  this.lastPosition.x += this.distanceSegment;
  this.lastDirection = "right";

  for(var i=0;i < numSegments - 2;i++){
    var thisPos = this.lastPosition.clone();
    this.geo.vertices.push(thisPos.clone());
    this.geo.colors.push(this.colorForSegment(i + 1, numSegments));

    switch(this.lastDirection){
      case "left":

        thisPos.y += (this.dragonRules[i] ? -this.distanceSegment : this.distanceSegment);
        this.lastDirection = (this.dragonRules[i] ? "up" : "down");
        break;
      case "right":
        thisPos.y += (this.dragonRules[i] ? this.distanceSegment : -this.distanceSegment);
        this.lastDirection = (this.dragonRules[i] ? "down" : "up");
        break;
      case "up":
        thisPos.x += (this.dragonRules[i] ? this.distanceSegment : -this.distanceSegment);
        this.lastDirection = (this.dragonRules[i] ? "right" : "left");
        break;
      case "down":
        thisPos.x += (this.dragonRules[i] ? -this.distanceSegment : this.distanceSegment);
        this.lastDirection = (this.dragonRules[i] ? "left" : "right");
        break;
    }
    this.lastPosition = thisPos.clone();
  }

  this.geo.vertices.push(this.lastPosition.clone());
  this.geo.colors.push(this.colorForSegment(numSegments, numSegments));

  this.fLine = new THREE.Line( this.geo, this.material );
  this.fLine.rotation.z = this.startRotation + this.iteration * -45 * (Math.PI / 180);
  this.fLine.position.set(this.x, this.y, 0);
  this.fLine.scale.x = this.fLine.scale.y = Math.pow(1.0 / Math.SQRT2, this.iteration - 1);
  context.scene.add( this.fLine );
}

var fractals = [];

var distanceToResetTimer = 20,
  stillTimeBetweenSpawnsMS = 1.5 * 1000;

function init(container) {
  context = new THREEContext(container);

  container.addEventListener( 'touchstart', onDocumentTouchStart, false );
  container.addEventListener( 'mousedown', onDocumentTouchStart, false);

  var f = new Fractal(Display.width/2, Display.height/2);
  fractals.push(f);
}

function onDocumentTouchStart( event ) {
  var f = new Fractal(event.offsetX,event.offsetY);
  fractals.push(f);
}

function animate(floor) {
  // Spawn fractals for users...
  for(var user of floor.users) {
    var shouldSpawn = false;

    if(!user.positionAtLastMovement) {
      // Must be a new user. Set their position, but don't spawn.
      user.positionAtLastMovement = { x: user.x, y: user.y };
      user.timeAtLastMovementOrSpawn = (new Date()).getTime();
    }
    else {
      // Have they moved far enough to reset their time?
      var dx = user.x - user.positionAtLastMovement.x,
        dy = user.y - user.positionAtLastMovement.y,
        d2 = dx * dx + dy * dy;

      if(d2 >= distanceToResetTimer * distanceToResetTimer) {
        // Yup, they moved too far.
        user.positionAtLastMovement = { x: user.x, y: user.y };
        user.timeAtLastMovementOrSpawn = (new Date()).getTime();
      }
      else {
        // So, they haven't moved far enough to reset the
        // timer. Have they been still for long enough to spawn?
        var now = (new Date()).getTime(),
          stillTime = now - user.timeAtLastMovementOrSpawn;

        if(stillTime >= stillTimeBetweenSpawnsMS) {
          shouldSpawn = true;
        }
      }
    }

    if(shouldSpawn) {
      user.timeAtLastMovementOrSpawn = (new Date()).getTime();
      fractals.push(new Fractal(user.x, user.y));
    }
  }

  for(var f of fractals) f.iterate();

  context.render();
}

export const behavior = {
  title: "Dragon Curves",
  frameRate: 12,
  init: init,
  render: animate
};
export default behavior;
