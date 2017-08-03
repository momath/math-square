/* MoMath Math Square Behavior
 *
 *        Title: Reaction Diffusion
 *  Description: Display heat map trails around users
 * Scheduler ID: 2
 *    Framework: THREE
 *       Author: ?
 *      Created: ?
 *       Status: partially working (no color)
 */

import * as Display from 'display';
import THREEContext from 'threectx';
import * as THREE from 'three';

const SCALE = 4.5;

function Buffer(){
  this.image;// = image;
  this.canvas = document.createElement('canvas');
  this.canvas.width = Display.width/SCALE;
  this.canvas.height = Display.height/SCALE;
  this.context = this.canvas.getContext( '2d' );
  this.pixelData = this.data();
  this.texture = new THREE.Texture(this.canvas);
  this.bufferBlur = 5;
  for(var y=0;y<this.canvas.height;y++){
    for(var x=0;x<this.canvas.width;x++) this.set(x,y,pixel(0,0,0,255));
  }
  this.update();
  this.doUpdate = true;
}

Buffer.prototype.data = function() {
  //this.context.drawImage( this.image, 0, 0 );
  return this.context.getImageData( 0, 0,  this.canvas.width, this.canvas.height); // this.image.width, this.image.height );
}

// pixel is object in r,g,b,a format
Buffer.prototype.pixel = function( x, y ) {
  var position = ( x + this.pixelData.width * y ) * 4;
  return { r: this.pixelData.data[ position ], g: this.pixelData.data[ position + 1 ], b: this.pixelData.data[ position + 2 ], a: this.pixelData.data[ position + 3 ] };
}

Buffer.prototype.set = function(x,y,p){
  // Don't allow drawing outside of the bounds of the data. Without this,
  // the position calculation below would continue as normal, resulting in
  // wrapping around the side of the image.
  if(x < 0 || x >= this.pixelData.width) return;
  if(y < 0 || y >= this.pixelData.height) return;

  var position = ( x + this.pixelData.width * y ) * 4;
  this.pixelData.data[position] = p.r;
  this.pixelData.data[position+1] = p.g;
  this.pixelData.data[position+2] = p.b;
  this.pixelData.data[position+3] = p.a;
}

Buffer.prototype.setCircle = function(_x,_y,_r,_p){
  var f = 1 - _r;
  var ddF_x = 1;
  var ddF_y = -2 * _r;
  var x = 0;
  var y = _r;

  this.set(_x, _y + _r,_p);
  this.set(_x, _y - _r,_p);
  this.set(_x + _r, _y,_p);
  this.set(_x - _r, _y,_p);

  while(x < y)
  {
    if(f >= 0)
    {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;
    this.set(_x + x, _y + y,_p);
    this.set(_x - x, _y + y,_p);
    this.set(_x + x, _y - y,_p);
    this.set(_x - x, _y - y,_p);
    this.set(_x + y, _y + x,_p);
    this.set(_x - y, _y + x,_p);
    this.set(_x + y, _y - x,_p);
    this.set(_x - y, _y - x,_p);
  }
}

Buffer.prototype.setImage = function(_image) {
  this.image = _image;
  console.log(_image);
  this.context.drawImage(this.image, 0,0);
  this.pixelData = this.data();
}

Buffer.prototype.update = function(){
  if(this.doUpdate){
    this.context.putImageData(this.pixelData,0,0);

    // this.pixelData = this.data();
    this.texture.needsUpdate = true;
  }
}
Buffer.prototype.blur = function(){
  if(this.doUpdate) stackBlurCanvasRGB(this.canvas, this.context, this.pixelData, this.bufferBlur);
  //  computeGaussSeidel(this.pixelData);
}

function pixel(_r,_g,_b,_a){
  return {r:_r, g:_g, b:_b, a:_a};
}


var mul_table = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
var shg_table = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];

function BlurStack() {
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 0;
  this.next = null
}

function stackBlurCanvasRGB(_canvas, _context, _pixels, _amount){
  // old ( a, b, c, d, f, g) {
  // a is canvas
  // b,c starting coords
  // d,f width/height
  //if(isNaN(g) || g < 1) return;
  //g |= 0;
  var h = _context; //a.getContext("2d");
  var j = _pixels;
  var b = 0;
  var c = 0;
  var d = _canvas.width;
  var f = _canvas.height;
  var g = _amount;
  // try {
  //   try {
  //     j = h.getImageData(b, c, d, f)
  //   } catch(e) {
  //     try {
  //       netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
  //       j = h.getImageData(b, c, d, f)
  //     } catch(e) {
  //       alert("Cannot access local image");
  //       throw new Error("unable to access local image data: " + e);
  //     }
  //   }
  // } catch(e) {
  //   alert("Cannot access image");
  //   throw new Error("unable to access image data: " + e);
  // }
  var k = j.data;
  var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, r_out_sum, g_out_sum, b_out_sum, r_in_sum, g_in_sum, b_in_sum, pr, pg, pb, rbs;
  var l = g + g + 1;
  var m = d << 2;
  var n = d - 1;
  var o = f - 1;
  var q = g + 1;
  var r = q * (q + 1) / 2;
  var s = new BlurStack();
  var t = s;
  for(i = 1; i < l; i++) {
    t = t.next = new BlurStack();
    if(i == q) var u = t
  }
  t.next = s;
  var v = null;
  var w = null;
  yw = yi = 0;
  var z = mul_table[g];
  var A = shg_table[g];
  for(y = 0; y < f; y++) {
    r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;
    r_out_sum = q * (pr = k[yi]);
    g_out_sum = q * (pg = k[yi + 1]);
    b_out_sum = q * (pb = k[yi + 2]);
    r_sum += r * pr;
    g_sum += r * pg;
    b_sum += r * pb;
    t = s;
    for(i = 0; i < q; i++) {
      t.r = pr;
      t.g = pg;
      t.b = pb;
      t = t.next
    }
    for(i = 1; i < q; i++) {
      p = yi + ((n < i ? n : i) << 2);
      r_sum += (t.r = (pr = k[p])) * (rbs = q - i);
      g_sum += (t.g = (pg = k[p + 1])) * rbs;
      b_sum += (t.b = (pb = k[p + 2])) * rbs;
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
      t = t.next
    }
    v = s;
    w = u;
    for(x = 0; x < d; x++) {
      k[yi] = (r_sum * z) >> A;
      k[yi + 1] = (g_sum * z) >> A;
      k[yi + 2] = (b_sum * z) >> A;
      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
      r_out_sum -= v.r;
      g_out_sum -= v.g;
      b_out_sum -= v.b;
      p = (yw + ((p = x + g + 1) < n ? p : n)) << 2;
      r_in_sum += (v.r = k[p]);
      g_in_sum += (v.g = k[p + 1]);
      b_in_sum += (v.b = k[p + 2]);
      r_sum += r_in_sum;
      g_sum += g_in_sum;
      b_sum += b_in_sum;
      v = v.next;
      r_out_sum += (pr = w.r);
      g_out_sum += (pg = w.g);
      b_out_sum += (pb = w.b);
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
      w = w.next;
      yi += 4
    }
    yw += d
  }
  for(x = 0; x < d; x++) {
    g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;
    yi = x << 2;
    r_out_sum = q * (pr = k[yi]);
    g_out_sum = q * (pg = k[yi + 1]);
    b_out_sum = q * (pb = k[yi + 2]);
    r_sum += r * pr;
    g_sum += r * pg;
    b_sum += r * pb;
    t = s;
    for(i = 0; i < q; i++) {
      t.r = pr;
      t.g = pg;
      t.b = pb;
      t = t.next
    }
    yp = d;
    for(i = 1; i <= g; i++) {
      yi = (yp + x) << 2;
      r_sum += (t.r = (pr = k[yi])) * (rbs = q - i);
      g_sum += (t.g = (pg = k[yi + 1])) * rbs;
      b_sum += (t.b = (pb = k[yi + 2])) * rbs;
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
      t = t.next;
      if(i < o) {
        yp += d
      }
    }
    yi = x;
    v = s;
    w = u;
    for(y = 0; y < f; y++) {
      p = yi << 2;
      k[p] = (r_sum * z) >> A;
      k[p + 1] = (g_sum * z) >> A;
      k[p + 2] = (b_sum * z) >> A;

      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
      r_out_sum -= v.r;
      g_out_sum -= v.g;
      b_out_sum -= v.b;
      p = (x + (((p = y + q) < o ? p : o) * d)) << 2;
      r_sum += (r_in_sum += (v.r = k[p]));
      g_sum += (g_in_sum += (v.g = k[p + 1]));
      b_sum += (b_in_sum += (v.b = k[p + 2]));
      v = v.next;
      r_out_sum += (pr = w.r);
      g_out_sum += (pg = w.g);
      b_out_sum += (pb = w.b);
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
      w = w.next;
      yi += d
    }
  }
  h.putImageData(j, b, c)
}

var mu, nu, xi, sigma, gamma, beta, delta, xLast = [], xCur = [], deltaX = 1.0, deltaY = 1.0, deltaT = 0.5;

sigma = 1.0 * deltaT / (deltaX * deltaX * deltaY * deltaY);
delta = 2.0 * (1.0 + sigma * (deltaY * deltaY + deltaX * deltaX));
gamma = -sigma * deltaY * deltaY;
beta = -sigma * deltaX * deltaX;

xi = 2.0 * (1.0 - sigma * deltaY * deltaY - sigma * deltaX * deltaX);

nu = sigma * deltaY * deltaY;
mu = sigma * deltaX * deltaX;

for(var i=0;i<(Display.width*Display.height)/SCALE;i++){
  xLast[i] = 0;
  xCur[i] = 0;
  if(i > 1000 && i < 6000) xCur[i] = 200;
}

function computeGaussSeidel(_pixels) {
  // need x, xLast
  var widthAndHeightThird = Display.width/SCALE;
  var r = [];
  //for(var i=0;i<xLast.length;i++) r[i] = 0;

  for (var i = 0; i < xCur.length; i++) {
    r[i] = xLast[i] * xi;
    if (i > 0) {
      r[i] += xLast[i - 1] * nu;
    }

    if (i < xCur.length - 1) {
      r[i] += xLast[i + 1] * nu;
    }

    if (i >= widthAndHeightThird) {
      r[i] += xLast[i - widthAndHeightThird] * mu;
    }

    if (i < xCur.length - widthAndHeightThird - 1) {
      r[i] += xLast[i + widthAndHeightThird] * mu;
    }
  }

  for (var n = 0; n < SCALE; n++) {
    for (var i = 1; i < xCur.length - 1; i++) {
      xCur[i] = r[i];

      if (i > 0) {
        xCur[i] -= gamma * xLast[i - 1];
      }

      if (i < xCur.length - 1) {
        xCur[i] -= gamma * xLast[i + 1];
      }


      if (i >= widthAndHeightThird) {
        xCur[i] -= beta * xLast[i - widthAndHeightThird];
      }


      if (i < xCur.length - widthAndHeightThird - 1) {
        xCur[i] -= beta * xLast[i + widthAndHeightThird];
      }

      xCur[i] /= delta;

      //Update x status
      xLast[i] = xCur[i];
    }
  }
  for(var i=0;i<xCur.length;i++){
    _pixels.data[(Math.floor(i/widthAndHeightThird) * widthAndHeightThird) + (i%widthAndHeightThird)] = xCur[i];
    _pixels.data[(Math.floor(i/widthAndHeightThird) * widthAndHeightThird) + (i%widthAndHeightThird)+1] = xCur[i];
    _pixels.data[(Math.floor(i/widthAndHeightThird) * widthAndHeightThird) + (i%widthAndHeightThird)+2] = xCur[i];
    _pixels.data[(Math.floor(i/widthAndHeightThird) * widthAndHeightThird) + (i%widthAndHeightThird)+2] = 255;
  }
}

var context;

var moduloCounter = 0;

var buffer;

function init(container) {
  context = new THREEContext(container);

  container.addEventListener( 'mousemove', onDocumentMouseMove, false );

  buffer = new Buffer();

  var cube = new THREE.Mesh(new THREE.CubeGeometry(Display.width,Display.height,5),new THREE.MeshBasicMaterial({map:buffer.texture}));

  /*
  var uniforms = {
    uvScale: { type: "v2", value: new THREE.Vector2( 1.0, 1.0 ) },
    texture1: { type: "t", value: 0, texture: buffer.texture },
  };
  var cube = new THREE.Mesh(new THREE.CubeGeometry(Display.width, Display.height, 2),new THREE.ShaderMaterial( {

    uniforms: uniforms,
    vertexShader: `
      uniform vec2 uvScale;
      varying vec2 vUv;

      void main()
      {
        vUv = uvScale * uv;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D texture1;
      varying vec2 TexCoord;
      varying vec2 vUv;

      void main()
      {
        vec4 pixcol = texture2D(texture1, vUv);
        vec4 colorsR, colorsG, colorsB;
        colorsR = vec4(0.,0.,1.,1.);
        colorsG = vec4(1.,1.,0.,1.);
        colorsB = vec4(1.,0.,0.,1.);
        float lum = (pixcol.r+pixcol.g+pixcol.b)/4.;
        int ix = (lum < 0.5)? 0:1;
        if(ix == 0){
          vec4 thermal = mix(colorsR,colorsG,(lum-float(0)*0.5)/0.5);
          gl_FragColor = thermal;
        } else {
          vec4 thermal = mix(colorsG,colorsB,(lum-float(1)*0.5)/0.5);
          gl_FragColor = thermal;
        }
      }
    `

  } ));
  */

  cube.scale.x = cube.scale.y = -1;
  cube.position.set(Display.width/2,Display.height/2,0);
  context.scene.add(cube);
}

function onDocumentMouseMove(event) {
  var mouseX = event.offsetX;
  var mouseY = event.offsetY;

  if(mouseX > 0 && mouseX < buffer.canvas.width*SCALE && mouseY > 0 && mouseY < buffer.canvas.height*SCALE){
    var ra = 15;
    var centralX = Math.floor(mouseX/SCALE);
    var centralY = Math.floor(mouseY/SCALE);
    // for(var x = centralX-ra;x<(centralX+ra);x++){
    //  for(var y = centralY-ra;y<(centralY+ra);y++){
    //      //xCur[(y * (Display.width/SCALE)) + x] = 255;
    //      buffer.set(centralX, centralY, pixel(255,255,255,255));
    //  }
    // }
    for(var i=1;i<10;i++){
      var intensity = 255 - (i/i * 2);
      buffer.setCircle(centralX, centralY, i, pixel(intensity,intensity,intensity,intensity));
    }

    buffer.update();
  }
}

function animate(floor) {
  for(var user of floor.users) {
    var ra = 15;
    var centralX = Math.floor(user.x /SCALE);
    var centralY = Math.floor(user.y /SCALE);

    for(var i=1;i<10;i++){
      var intensity = 255 - (i/i * 2);
      buffer.setCircle(centralX, centralY, i, pixel(intensity,intensity,intensity,intensity));
    }

    if(moduloCounter % 1 == 0){
      for(var i=1;i<2;i++){
        var intensity = 0 + (i/i * 2);
        buffer.setCircle(0, 0, i, pixel(intensity,intensity,intensity,255));
        buffer.setCircle(Display.width/SCALE, 0, i, pixel(intensity,intensity,intensity,255));
        buffer.setCircle(0, Display.height/SCALE, i, pixel(intensity,intensity,intensity,255));
      }
    }
  }
  //if(buffer != undefined) if(buffer.texture != undefined) buffer.update();

  for(var i = 0; i < 5; i++) {
    buffer.update();
    buffer.blur();
  }

  context.render();
  moduloCounter++;
}

export const behavior = {
  title: "Reaction Diffusion",
  frameRate: 'animate',
  init: init,
  render: animate
};
export default behavior;
