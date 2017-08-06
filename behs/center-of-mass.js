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

/** Lifecycle Functions **/
pb.setup = function(p) {
  this.drawCircle = drawCircle;
  this.drawLine = drawLine;
  this.drawCenterMassConnectors = drawCenterMassConnectors;
  this.restoreDefaults = restoreDefaults;
  this.drawGoal = drawGoal;
  this.distToColor = distToColor;
  this.updateGoal = updateGoal;
  this.updateGoal();
};

pb.draw = function(floor, p) {
  this.clear();
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
    this.updateGoal(p);
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
