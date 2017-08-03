/* MoMath Math Square Behavior
 *
 *        Title: Protect the King
 *  Description: Users defend the "King" by blocking approaching waves
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Sebastien Siclait <siclait@momath.org>
 *      Created: 2017-06
 *       Status: works / in dev
 */

import P5Behavior from 'p5beh';

const pb = new P5Behavior();
var x,y;
var direction = 1;
var collision = true;
var top, bottom, left, right;
var gameOver;
var gameOverImage;
var gameOverCounter = 0;
var lifeImage;
var lives = 3;

pb.preload = function (p) {
  /* this == pb.p5 == p */
  // ...  
  // gameOverImage = this.loadImage('images/youLose.png')
}

pb.setup = function (p) {
  /* this == pb.p5 == p */
  /* P5Behavior already calls createCanvas for us */
  // setup here...\
  lifeImage = this.loadImage('images/basqCrown.png');
  gameOverImage = this.loadImage('images/youLose.png');
}

pb.draw = function (floor, p) {
  /* this == pb.p5 == p */
  // draw here...\

  this.clear();

  // Chooses direction of next attack
  if (collision) {
    direction = Math.floor(Math.random() * 4) + 1;
  }

  // if (collision) {
  //   if (direction == 1) 
  //     direction = 2;
  //   else
  //     direction = 1;
  // }

  // Displays number of lives
  switch(lives) {
    case 3:
      this.image(lifeImage, 20, 530, 30, 30);
      this.image(lifeImage, 60, 530, 30, 30);
      this.image(lifeImage, 100, 530, 30, 30);
    case 2:
      this.image(lifeImage, 20, 530, 30, 30);
      this.image(lifeImage, 60, 530, 30, 30);
    case 1:
      this.image(lifeImage, 20, 530, 30, 30);
    case 0:
  }

  // Drawing unit for lines
  for (let user of floor.users) {
    pb.drawUser(user);
    switch(direction) {
      // Coming from the bottom (decreasing y-coordinate)
      case 1:
        // Resets line, if necessary 
        if (collision) {
          y = this.height;
          collision = false;
        }

        // Moves line
        y = y - 1;
        this.stroke('#DC7A0E');
        this.line(0, y, this.width, y);

        // Checks for successful user intervention
        if (user.y > y) {
          collision = true;
        }
        break;
      // Coming from the right (decreasing x-coordinate)
      case 2:
        if (collision) {
          x = this.width;
          collision = false;
        }

        x = x - 1;
        this.stroke('#DC7A0E');
        this.line(x, 0, x, this.height);

        if (user.x > x) {
          collision = true;
        }
        break;
      // Coming from the top (increasing y-coordinate)
      case 3:
        if (collision) {
          y = 0;
          collision = false;
        }

        y = y + 1;
        this.stroke('#DC7A0E');
        this.line(0, y, this.width, y);

        if (user.y < y) {
          collision = true;
        }
        break;
      // Coming from the left (increasing x-coordinate)
      case 4:
        if (collision) {
          x = 0;
          collision = false;
        }

        x = x + 1;
        this.stroke('#DC7A0E');
        this.line(x, 0, x, this.height);

        if (user.x < x) {
          collision = true;
        }
        break;
    }
  }
  
  // Draws central circle (King)
  if (gameOverCounter == 0) {
    this.fill('#3BDBE9');
    this.ellipse(this.width / 2, this.height / 2, 80, 80);
  } else {
    this.image(gameOverImage, 0, 0, this.width, this.height);
    gameOverCounter = gameOverCounter - 1;
  }

  // Set dimensions of circle to determine loss 
  top = this.height / 2 + 40;
  bottom = this.height / 2 - 40;
  right = this.width / 2 + 40;
  left = this.width / 2 - 40;

  // Line makes it to the circle and "hurts" the king
  if ((x < right && x > left) || (y < top && y > bottom)) {
    if (lives > 0) {
      this.fill('red');
      this.rect(0, 0, this.width, this.height);
      lives = lives - 1;
    }

    // Displays gameOverImage when the players have no more lives
    else {
      this.image(gameOverImage, 0, 0, this.width, this.height);
      lives = 3;
      gameOver = true;
      gameOverCounter = 60;
    }
    x = 0;
    y = 0;

    collision = true;
  }
  console.log(lives);
  console.log(collision);

};

export const behavior = {
  title: "Protect the King",
  init: pb.init.bind(pb),
  frameRate: 'sensor',
  render: pb.render.bind(pb),
  numGhosts: 1
};
export default behavior