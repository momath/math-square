/* MoMath Math Square Behavior
 *
 *        Title: Center of Mass
 *  Description: Displays center of mass of users
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Brian Sapozhnikov <brian.sapozhnikov@gmail.com>,  Lise Ho <lise.ho6@gmail.com>, Shaan Sheikh <shaansweb@gmail.com>, Mary Taft <mary.taft97@gmail.com>
 *      Created: 2017-08-05
 *       Status: works
 */

/** Imports and Constants **/
import P5Behavior from 'p5beh';
import * as Display from 'display';

const pb = new P5Behavior();

const COLORS = {
  RED: [255, 0, 0],
  GREEN: [0, 255, 0],
  BLUE: [0, 0, 255],
  GRAY: [155, 155, 155],
  BLACK: [0, 0, 0]
};

const CENTER_RADIUS = 20;
const GOAL_RADIUS = 10;
const goalX, goalY = parseInt(Math.random() * Display.width);
const MASS_CONNECTORS_STROKE_WEIGHT = 4;

// Create constants for hole specs.
const HOLE_DIAMETER = 20;
const HOLE_X = parseInt(Math.random() * Display.width);
const HOLE_Y = parseInt(Math.random() * Display.height);

// Other vars which aren't consts
var gameOver = 0; // 0: still playing; 1: done playing (rotating)

/** Helper Functions **/
const drawCircle = function(x, y, r, color) {
  if (color) {
    this.fill(color);
  }
  this.ellipse(x, y, r * 2, r * 2);
};

const drawLine = function(x1, y1, x2, y2, strokeColor, strokeWeight) {
  this.strokeWeight(strokeWeight);
  this.stroke(strokeColor);
  this.line(x1, y1, x2, y2);
  this.restoreDefaults();
};

const drawCenterMassConnectors = function (x1, y1, x2, y2) {
  this.drawLine(x1, y1, x2, y2, COLORS.GREEN, MASS_CONNECTORS_STROKE_WEIGHT);
};

const restoreDefaults = function() {
    // Reset defaults for fill/stroke colors.
    this.strokeWeight(1);
    this.stroke(COLORS.BLACK);
};

const drawGoal = function(){
  this.drawCircle(this.goalX, this.goalY, GOAL_RADIUS, COLORS.RED);
};

const updateGoal = function(){
  this.goalX = parseInt(Math.random() * Display.width * (2/3) + (Display.width * (1/6)));
  this.goalY = parseInt(Math.random() * Display.height * (2/3) + (Display.height * (1/6)));
};

const distToColor = function(d) {
  const corners = [
    [0, 0], 
    [0, Display.height],
    [Display.width, 0],
    [Display.width, Display.height]
  ];
  const dists = corners.map(point => this.dist(point[0], point[1], this.goalX, this.goalY));
  const maxDist = this.max(dists);
  const MIDPOINT = 0.5;
  const ratio = d / maxDist;
  const red = this.color(255, 0, 0);
  const blue = this.color(0, 0, 255);
  const sat = parseInt(this.abs(ratio - MIDPOINT) * 100);
  const colStr = 'hsb(' + this.hue(ratio > MIDPOINT ? blue : red) + ', ' + sat + '%, 100%)';
  return this.color(colStr);
};

const rotatePolygon(points, centerX, centerY){
  
  this.translate(centerX, centerY);
  this.angleMode(this.RADIANS);
  this.rotate(this.PI/12);
  this.rect(-50,-50,100,100);

};

/** Lifecycle Functions **/
pb.setup = function(p) {
  this.gameOver = 0;
  this.drawCircle = drawCircle;
  this.drawLine = drawLine;
  this.drawCenterMassConnectors = drawCenterMassConnectors;
  this.restoreDefaults = restoreDefaults;
  this.drawGoal = drawGoal;
  this.distToColor = distToColor;
  this.rotatePolygon = rotatePolygon;
  this.updateGoal = updateGoal;
  this.updateGoal();
};

  /*
  //this.rect(0,0,20,40);
  this.translate(Display.width/2+170,50);
  this.rect(0,0,5,5);
  this.angleMode(this.RADIANS);
  this.rotate(this.PI/3);
  this.rect(0,0,20,40);
  this.translate(40, 40);
  this.rect(0,0,20,40);
  //this.rect(Display.width/2,Display.width/2,20,40);
  */

pb.draw = function(floor, p) {
  this.clear();
  if(!this.gameOver){

    let centerX = 0, centerY = 0, numUsers = 0;

    for (let user of floor.users) {
      centerX += user.x;
      centerY += user.y;
      numUsers++;
      pb.drawUser(user);

    }
    centerX /= numUsers;
    centerY /= numUsers;
    for (let user of floor.users) {
      this.drawCenterMassConnectors(user.x, user.y, centerX, centerY);
    }
    const distToGoal = this.dist(centerX, centerY, this.goalX, this.goalY);
    this.drawCircle(centerX, centerY, CENTER_RADIUS, this.distToColor(distToGoal));

    this.drawGoal();
    var distance = ((centerX-this.goalX)**2 + (centerY-this.goalY)**2)**0.5
    if ( distance <30)   {
      //this.updateGoal(p);
      this.gameOver = 1;
    }


  } else {
    this.translate(0,0);
    this.rotatePolygon(null, this.goalX, this.goalY);
  }
};

/** Export **/
export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 2
};
export default behavior;
