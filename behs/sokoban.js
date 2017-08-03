/* MoMath Math Square Behavior
 *
 *        Title: Sokoban
 *  Description: Sokoban game with two levels
 * Scheduler ID: 4
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *      Updated: 2017-04 for SDK and new three.js by dylan
 *       Status: works
 */

import THREEContext from 'threectx';
import * as THREE from 'three';
import * as TWEEN from 'tween.js';
import * as Display from 'display';

var context;

// 432x432 (size of 18 accounts for 24x24 blocks)
var LEVEL_SIZE = 18;
var BLOCK_SIZE = Display.width / LEVEL_SIZE; // XXX assuming square display
var ANIMATE_SPEED = 0.25;
var walls = [];
var sokuUsers = [];
var blocks = [];
var goals = [];
var adjoining = [
  { x:  0, y: +1 },
  { x:  0, y: -1 },
  { x: +1, y:  0 },
  { x: -1, y:  0 },
];

function Wall(_x, _y, opacity){
  this.position = new THREE.Vector3(_x, _y);

  this.wallTexture = context.textures['images/brick.png'];
  this.cube = new THREE.Mesh(new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), new THREE.MeshBasicMaterial({ map: this.wallTexture, transparent: true, opacity: opacity }));
  this.cube.overdraw = true;
  this.cube.rotation.x = Math.PI;
  this.cube.position.set(this.position.x*BLOCK_SIZE + (BLOCK_SIZE/2), this.position.y*BLOCK_SIZE + (BLOCK_SIZE/2),0);
  context.scene.add(this.cube);
}

function Goal(_x, _y, opacity) {
  this.position = new THREE.Vector3(_x, _y);

  this.cube = new THREE.Mesh(new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), new THREE.MeshBasicMaterial({ color: 0x006611, transparent: true, opacity: opacity }));
  this.cube.overdraw = true;
  this.cube.rotation.x = Math.PI;
  this.cube.position.set(this.position.x*BLOCK_SIZE + (BLOCK_SIZE/2), this.position.y*BLOCK_SIZE + (BLOCK_SIZE/2),0);
  context.scene.add(this.cube);
}


function SokuUser(_x, _y){
  this.position = new THREE.Vector3(_x, _y);

  this.cube = new THREE.Mesh(new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), new THREE.MeshBasicMaterial({color:0x880000}));
  this.cube.position.set(this.position.x*BLOCK_SIZE + (BLOCK_SIZE/2), this.position.y*BLOCK_SIZE + (BLOCK_SIZE/2),0);
  context.scene.add(this.cube);
}

function Blocks(_x, _y, opacity){
  this.position = new THREE.Vector3(_x, _y);
  this.originalPosition = new THREE.Vector3(_x, _y);
  this.destination = new THREE.Vector3(_x,_y);

  this.blockTexture = context.textures["images/box.png"];
  this.goalTexture = context.textures["images/box-goal.png"];
  this.normalMaterial = new THREE.MeshBasicMaterial({map:this.blockTexture, transparent: true, opacity: opacity });
  this.goalMaterial = new THREE.MeshBasicMaterial({map:this.goalTexture, transparent: true});
  this.cube = new THREE.Mesh(new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), this.normalMaterial);
  this.cube.position.set(this.position.x*BLOCK_SIZE + (BLOCK_SIZE/2), this.position.y*BLOCK_SIZE + (BLOCK_SIZE/2),0);
  context.scene.add(this.cube);
  this.isAnimating = false;
}

Blocks.prototype.update = function(){
  if(this.respawning) return;

  if(this.isAnimating){
    if(this.position.x == this.destination.x && this.position.y == this.destination.y){
      this.isAnimating = false;
      this.didMove();
    } else {
      if(this.position.x != this.destination.x) this.position.x = this.position.x + ((this.position.x > this.destination.x ? -1 : 1) * ANIMATE_SPEED)
      if(this.position.y != this.destination.y) this.position.y = this.position.y + ((this.position.y > this.destination.y ? -1 : 1) * ANIMATE_SPEED)
    }
    this.cube.position.set(this.position.x*BLOCK_SIZE + (BLOCK_SIZE/2), this.position.y*BLOCK_SIZE + (BLOCK_SIZE/2),0);
  }
}

Blocks.prototype.isAdjacent = function(_x, _y){
  return (((this.position.x == _x + 1 || this.position.x == _x - 1) && this.position.y == _y ) ||
    ((this.position.y == _y + 1 || this.position.y == _y - 1) && this.position.x == _x ));
}

Blocks.prototype.attemptMove = function(_x, _y){
  // Don't allow dying blocks to be moved
  if(this.respawning || this.isAnimating) return false;

  var direction = new THREE.Vector3(this.position.x, this.position.y, 0);
  if(_x > this.position.x) direction.x -= 1;
  if(_x < this.position.x) direction.x += 1;
  if(_y > this.position.y) direction.y -= 1;
  if(_y < this.position.y) direction.y += 1;

  if(!isOnObject(direction.x,direction.y)){ 
    this.destination = direction.clone();
    this.willMoveToDestination();
    return true;
  }

  return false;
}

Blocks.prototype.willMoveToDestination = function() {
  //console.log('block at (' + this.position.x + ', ' + this.position.y + ') will move to (' + this.destination.x + ', ' + this.destination.y + ')');
  this.isAnimating = true;

  // If moving to a goal, hide it. If leaving one, show it again.
  // Drawing a Block on top of a Goal flickers sometimes. Could probably
  // fix by adjusting the z of Blocks, but eh.

  var goal = goalAt(this.destination.x, this.destination.y);
  if(this.goal && this.goal != goal) {
    // Leaving a goal
    this.goal.cube.material.opacity = 1;
  }

  if(goal)
    goal.cube.material.opacity = 0;

  this.goal = goal;
}

Blocks.prototype.didMove = function() {
  if(this.goal) {
    // Usually it is the case that moving a block can only trigger the
    // stuckness of the block that moved. However, if a blocked moved
    // into a goal, it can trigger the stuckness of blocks around it,
    // since the goal state takes precedence. So if we moved into a goal,
    // check if the blocks around us need to respawn.
    this.cube.material = this.goalMaterial;

    for(var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if(block.isAdjacent(this.position.x, this.position.y))
        block.respawnIfNeeded();
    }

    if(allGoalsSatisfied())
      nextRoom();
  }
  else {
    this.respawnIfNeeded();
    this.cube.material = this.normalMaterial;
  }
}

Blocks.prototype.respawnIfNeeded = function() {
  if(this.isStuck()) {
    // This flag stops the block from being moved during its death
    this.respawning = true;
    var capturedThis = this;
    this._deathTween = new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, 3000)
      .easing(function(k) {
        var pulses = 2;
        return 0.5 * Math.exp(k - 1) * (1 - Math.cos((pulses * 2 + 1) * Math.PI * k));
      })
      .onUpdate(function() {
        capturedThis.cube.material.opacity = this.opacity;
      })
      .onComplete(function() {
        capturedThis.respawn();
      })
      .delay(500)
      .start();
  }
}

Blocks.prototype.respawn = function() {
  var respawnPosition;

  //console.log('block at (' + this.position.x + ', ' + this.position.y + ') needs respawn');

  if(!isOnObject(this.originalPosition.x, this.originalPosition.y)) {
    // Our original position unoccupied? Respawn there.
    respawnPosition = this.originalPosition.clone();
  }
  else {
    // Find another spawn point from the other blocks.
    // We are guaranteed to find one; if all blocks were in their original
    // positions, this block would not be stuck.
    for(var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if(!isOnObject(block.originalPosition.x, block.originalPosition.y)) {
        respawnPosition = block.originalPosition.clone();
        break;
      }
    }
  }

  if(!respawnPosition) debugger;

  this.position = respawnPosition;
  this.cube.position.set(this.position.x*BLOCK_SIZE + (BLOCK_SIZE/2), this.position.y*BLOCK_SIZE + (BLOCK_SIZE/2),0);

  var capturedThis = this;
  this._respawnTween = new TWEEN.Tween({ opacity: 0 })
    .to({ opacity: 1 }, 1000)
    .easing(TWEEN.Easing.Sinusoidal.Out)
    .onUpdate(function() {
      capturedThis.cube.material.opacity = this.opacity;
    })
    .onComplete(function() {
      capturedThis.respawning = false;
    })
    .start();
}

Blocks.prototype.isStuck = function() {
  if(this.goal) return false;

  var vColored = [], hColored = [];
  return !this.canMoveVertically(vColored, hColored) &&
    !this.canMoveHorizontally(vColored, hColored);
}

Blocks.prototype.canMoveVertically = function(vColored, hColored) {
  if(vColored.indexOf(this) >= 0)
    return false;

  vColored.push(this);

  // Walls above or below are instant death.
  for(var i = 0; i < walls.length; i++) {
    var wall = walls[i];
    if(wall.position.x == this.position.x) {
      if(wall.position.y == this.position.y + 1 || wall.position.y == this.position.y - 1)
        return false;
    }
  }

  // Blocks above and below us cannot move vertically (because we are in the
  // way). But they only stop us from moving vertically if they cannot both be
  // moved horizontally out of the way.
  var below, above;
  for(var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    if(block.position.x == this.position.x) {
      if(block.position.y == this.position.y + 1)
        below = block;
      else if(block.position.y == this.position.y - 1)
        above = block;
    }
  }

  if(below && above)
    return below.canMoveHorizontally(vColored, hColored) && above.canMoveHorizontally(vColored, hColored);
  else if(below)
    return below.canMoveHorizontally(vColored, hColored);
  else if(above)
    return above.canMoveHorizontally(vColored, hColored);

  return true;
}

Blocks.prototype.canMoveHorizontally = function(vColored, hColored) {
  if(hColored.indexOf(this) >= 0)
    return false;

  hColored.push(this);

  // Walls to the left or right are instant death.
  for(var i = 0; i < walls.length; i++) {
    var wall = walls[i];
    if(wall.position.y == this.position.y) {
      if(wall.position.x == this.position.x + 1 || wall.position.x == this.position.x - 1)
        return false;
    }
  }

  // Blocks to our left and right cannot move horizontally (because we are in
  // the way). But they only stop us from moving horizontally if they cannot
  // both be moved vertically out of the way.
  var left, right;
  for(var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    if(block.position.y == this.position.y) {
      if(block.position.x == this.position.x + 1)
        right = block;
      else if(block.position.x == this.position.x - 1)
        left = block;
    }
  }

  if(left && right)
    return left.canMoveVertically(vColored, hColored) && right.canMoveVertically(vColored, hColored);
  else if(left)
    return left.canMoveVertically(vColored, hColored);
  else if(right)
    return right.canMoveVertically(vColored, hColored);

  return true;
}



function isOnObject(_x, _y){
  for(var b in blocks) if(blocks[b].position.x == _x && blocks[b].position.y == _y) return true;
  for(var w in walls) if(walls[w].position.x == _x && walls[w].position.y == _y) return true;

  return false;
}

function goalAt(_x, _y) {
  for(var g in goals) if(goals[g].position.x == _x && goals[g].position.y == _y) return goals[g];

  return undefined;
}

function allGoalsSatisfied() {
  for(var b in blocks) {
    if(!blocks[b].goal)
      return false;
  }

  return true;
}

var blockX, blockY;
var controls;

var mode3D = false;
var cSphere = new THREE.Mesh(new THREE.SphereGeometry(6,6,6),new THREE.MeshBasicMaterial({color:0xffffff}));
var switchingRoom = true;
var roomSwitchTween;

var rooms = [['##################',
  '# xG             #',
  '######           #',
  '#                #',
  '#           # ####',
  '# #x        x    #',
  '#G#              #',
  '######      #  G #',
  '#           ######',
  '#               G#',
  '#         #    x #',
  '##    #### #     #',
  '#     ## x #     #',
  '#     ###    G   #',
  '#G#x  ########   #',
  '# x             ##',
  '#G#            ###',
  '##################'],

  ['##################',
    '#G    #G  # #    #',
    '# # # ## ## #    #',
    '#   x ## ##    #G#',
    '#    ##  x #x# ###',
    '#  ##### ### ##  #',
    '##############   #',
    '#                #',
    '#   ##########   #',
    '#   #        #   #',
    '#   #        #   #',
    '#   #   ###  #   #',
    '#   #    G#  #   #',
    '#   #######  #   #',
    '#   x        #   #',
    '#            #   #',
    '#   ##########   #',
    '##################']];

var currentRoomIdx = 0;

function init(container) {
  context = new THREEContext(container);

  container.addEventListener( 'touchstart', onDocumentTouchStart, false );
  container.addEventListener( 'mousedown', onDocumentTouchStart, false);

  return context.loadTextures([
      'images/brick.png', 
      "images/box.png",
      "images/box-goal.png"
    ]).then(() => switchRoom(rooms[0], true));
}

function switchRoom(roomDef, noAnimation) {
  // Reset
  switchingRoom = true;

  if(noAnimation) {
    _reallySwitchRoom(roomDef);
    return;
  }

  var originalXRotation = context.camera.rotation.x,
    originalYRotation = context.camera.rotation.y,
    rxdelta = Math.PI / 4,
    rydelta = Math.PI / 2;

  // Fade and rotate out, then back in.
  var fadeOutTime = 500,
    fadeInTime = 500,
    animationDelay = 500;

  roomSwitchTween = new TWEEN.Tween({ opacity: 1, rx: originalXRotation, ry: originalYRotation })
    .to({ opacity: 0, rx: originalXRotation + rxdelta, ry: originalYRotation + rydelta }, fadeOutTime)
    .onUpdate(function() {
      for(var i = 0; i < context.scene.children.length; i++) {
        var child = context.scene.children[i];

        if(child == cSphere) continue;
        child.material.opacity = this.opacity;
        context.camera.rotation.x = this.rx;
        context.camera.rotation.y = this.ry;
      }
    })
    .onComplete(function() {
      _reallySwitchRoom(roomDef, true);
      new TWEEN.Tween({ opacity: 0, rx: originalXRotation + rxdelta, ry: originalYRotation + rydelta })
        .to({ opacity: 1, rx: originalXRotation, ry: originalYRotation }, fadeInTime)
        .onUpdate(function() {
          for(var i = 0; i < context.scene.children.length; i++) {
            var child = context.scene.children[i];

            if(child == cSphere) continue;
            child.material.opacity = this.opacity;
            context.camera.rotation.x = this.rx;
            context.camera.rotation.y = this.ry;
          }
        })
        .onComplete(function() {
          switchingRoom = false;
        })
        .start();
    })
    .delay(animationDelay)
    .start();
}

function _reallySwitchRoom(roomDef, tweening) {
  for(var i = context.scene.children.length - 1; i >= 0; i--) {
    var child = context.scene.children[i];
    if(child != cSphere)
      context.scene.remove(child);
  }

  walls = [];
  blocks = [];
  goals = [];

  var opacity = tweening ? 0 : 1;

  var charFactories = {
    '#': function(x, y) { walls.push(new Wall(x, y, opacity)); },
    'x': function(x, y) { blocks.push(new Blocks(x, y, opacity)); },
    'G': function(x, y) { goals.push(new Goal(x, y, opacity)); }
  };

  for(var y = 0; y < LEVEL_SIZE; y++) {
    for(var x = 0; x < LEVEL_SIZE; x++) {
      var factory = charFactories[roomDef[y].charAt(x)];
      if(factory)
        factory(x, y);
    }
  }

  if(!tweening)
    switchingRoom = false;
  else {
    for(var i = context.scene.children.length - 1; i >= 0; i--) {
      var child = context.scene.children[i];
      if(child != cSphere)
        child.opacity = 0;
    }
  }
}

function nextRoom() {
  currentRoomIdx++;
  if(currentRoomIdx == rooms.length)
    currentRoomIdx = 0;

  switchRoom(rooms[currentRoomIdx]);
}

function updateRoom(){
  for(b in blocks){
    if(blocks[b].isAdjacent(blockX, blockY)){
      blocks[b].attemptMove(blockX,blockY);
    }
  }
}

function onDocumentTouchStart( event ) {
  var mouseX = Math.floor(event.offsetX/BLOCK_SIZE),
      mouseY = Math.floor(event.offsetY/BLOCK_SIZE);
  for(var b of blocks) {
    /* find unique adjoining occupied square */
    for (var a of adjoining) {
      let x = b.position.x+a.x,
          y = b.position.y+a.y;
      if (x == mouseX && y == mouseY && !isOnObject(x, y)) {
        b.attemptMove(x, y);
        return;
      }
    }
  }

  nextRoom();
}

/* determine if someone is standing on a block */
function standingOnBlock(sensors, x, y) {
  x *= BLOCK_SIZE;
  y *= BLOCK_SIZE;
  return sensors.countBlock(Display.toSensor(x, y),
    Display.toSensor(x+BLOCK_SIZE, y+BLOCK_SIZE)) > 2;
}

//

function animate(floor) {

  if(mode3D) controls.update();

  if(!switchingRoom) {
    for(var block of blocks) {
      /* it can't move if you're standing on it! */
      var o = standingOnBlock(floor.sensors, block.position.x, block.position.y);
      if (!o) {
        var w = undefined;
        /* find unique adjoining occupied square */
        for (var a of adjoining) {
          let x = block.position.x+a.x,
              y = block.position.y+a.y;
          if (!isOnObject(x, y) && standingOnBlock(floor.sensors, x, y)) {
            if (w !== undefined) {
              w = null;
              break;
            }
            w = {x:x, y:y};
          }
        }

        if (w)
          block.attemptMove(w.x, w.y);
      }

      block.update();
    }
  }

  TWEEN.update();
  context.render();
}

export const behavior = {
  title: "Sokoban",
  frameRate: 'animate',
  maxUsers: 0,
  init: init,
  render: animate
};
export default behavior;
