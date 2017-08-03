/* MoMath Math Square Behavior
 *
 *        Title: Gravity
 *  Description: meteor accelerates and moves based off of users as simulated gravitational bodies
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Allen He <he@momath.org>
 *      Created: 2017-05-23
 *       Status: works
 */

import * as Display from 'display'
import P5Behavior from 'p5beh';
import * as Floor from 'floor';

const pb = new P5Behavior();
const METEOR_RADIUS = 15;
const TARGET_RADIUS = 20;
const FPS = 20;
const MAX_VELOCITY = 15;
//strength of gravitational pull of users
const ACCELERATION_CONSTANT = 25;
//amount tail grows by each time target is hit
const TAIL_INTERVAL = 10;

//meteor movement variables
var meteorXVelocity;
var meteorYVelocity;
var meteorXPos;
var meteorYPos;

//target location variables
var targetXPos;
var targetYPos;

//parallel arrays to keep track of meteor's previous positions, and index to keep current position in arrays
var tailPointsX;
var tailPointsY;
var tailIndex;
//length of meteor movement trace tail
var tailLength = 50;

var meteorImage;
var targetImage;

//moves target to random location, updates tail length
function randomizeTarget(){
  targetXPos = TARGET_RADIUS + Math.random()*(Display.width - TARGET_RADIUS * 2);
  targetYPos = TARGET_RADIUS + Math.random()*(Display.height - TARGET_RADIUS * 2);
  tailLength += TAIL_INTERVAL;
}

pb.preload = function (p) {
  meteorImage = this.loadImage('images/meteor.png')
  targetImage = this.loadImage('images/target.png')
}

pb.setup = function (p) {
  meteorXVelocity = 1;
  meteorYVelocity = 0;
  meteorXPos = Display.width/4;
  meteorYPos = Display.height/4;
  randomizeTarget();
  tailPointsX = []
  tailPointsY = []
  tailIndex = 0;
};

pb.draw = function (floor, p) {

  this.clear();

  let currUsers = floor.users;
  
  //draw users at current coordinates
  for (let user of currUsers) {
    pb.drawUser(user);
  }

  //update and draw tail
  tailPointsX[tailIndex] = meteorXPos;
  tailPointsY[tailIndex] = meteorYPos;
  tailIndex++;
  if(tailIndex == tailLength){
    tailIndex = 0;
  }

  var alpha = 0;
  var size = 0;
  var sizeInterval = (METEOR_RADIUS)/tailLength
  var alphaInterval = 0.5/tailLength

  this.noStroke()
  for(var i = tailIndex; i < tailPointsX.length; i++){
    this.fill('rgba(242, 135, 36, ' + alpha + ')');
    this.ellipse(tailPointsX[i], tailPointsY[i], size, size);
    alpha += alphaInterval;
    size += sizeInterval;
  }
  for(var i = 0; i < tailIndex; i++){
    this.fill('rgba(242, 135, 36, ' + alpha + ')');
    this.ellipse(tailPointsX[i], tailPointsY[i], size, size);
    alpha += alphaInterval;
    size += sizeInterval;
  }
    
  //calculate acceleration - a ~ 1/(d^2)
  var meteorXAcceleration = 0;
  var meteorYAcceleration = 0;
  for(let user of currUsers) {
    var xDistance = user.x - meteorXPos;
    var yDistance = user.y - meteorYPos;
    var totalDistance = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2))
    //prevent too large of an acceleration
    if(totalDistance < 2){
        continue;
    }
    meteorXAcceleration += (ACCELERATION_CONSTANT*xDistance)/Math.pow(totalDistance, 2)
    meteorYAcceleration += (ACCELERATION_CONSTANT*yDistance)/Math.pow(totalDistance, 2)
  }

  //update velocity and clip at max velocity
  meteorXVelocity += meteorXAcceleration
  meteorYVelocity += meteorYAcceleration

  if(meteorXVelocity > MAX_VELOCITY){
    meteorXVelocity = MAX_VELOCITY
  }
  if(meteorXVelocity < -MAX_VELOCITY){
    meteorXVelocity = -MAX_VELOCITY
  }
  if(meteorYVelocity > MAX_VELOCITY){
    meteorYVelocity = MAX_VELOCITY
  }
  if(meteorYVelocity < -MAX_VELOCITY){
    meteorYVelocity = -MAX_VELOCITY
  }

  //update position and clip positioning to ensure meteor in bounds
  meteorXPos += meteorXVelocity
  meteorYPos += meteorYVelocity

  if(meteorXPos < 0 + METEOR_RADIUS){
    meteorXPos = 0 + METEOR_RADIUS;
    meteorXVelocity = 0;
  } 
  if(meteorYPos < 0 + METEOR_RADIUS){
    meteorYPos = 0 + METEOR_RADIUS;
    meteorYVelocity = 0;
  }
  if(meteorXPos > Display.width - METEOR_RADIUS){
    meteorXPos = Display.width - METEOR_RADIUS;
    meteorXVelocity = 0;
  }
  if(meteorYPos > Display.height - METEOR_RADIUS){
    meteorYPos = Display.height - METEOR_RADIUS;
    meteorYVelocity = 0;
  }

  //draw meteor at new position
  this.image(meteorImage, meteorXPos - METEOR_RADIUS, meteorYPos - METEOR_RADIUS, METEOR_RADIUS * 2, METEOR_RADIUS * 2, 0, 0)

  //check if target collided based on circular distance check, reset target and grow tail if so
  var dx = meteorXPos - targetXPos;
  var dy = meteorYPos - targetYPos;
  var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

  if (distance < TARGET_RADIUS + METEOR_RADIUS){
    randomizeTarget();
  }

  //draw target at current position
  this.image(targetImage, targetXPos - TARGET_RADIUS, targetYPos - TARGET_RADIUS, TARGET_RADIUS * 2, TARGET_RADIUS * 2, 0, 0)
};


export const behavior = {
  title: "Gravity (P5)",
  init: pb.init.bind(pb),
  frameRate: FPS,
  render: pb.render.bind(pb),
  numGhosts: 2,
  ghostBounds: {x: Display.width/4, y: Display.height/4, width: Display.width/2, height: Display.height/2}
};
export default behavior
