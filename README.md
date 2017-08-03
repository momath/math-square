# MoMath _Math Square_

## Overview

The _Math Square_ is a walkable floor with a full-color 576x576 pixel display, overlaid with a 72x72 binary (on-off) sensor grid.
The floor is made up of 81 (9x9) identical squares, each with a 64x64 LED display and 8x8 touch sensors.
The display on the floor is mapped to an [Electron](https://electron.atom.io/) browser window loading this directory to display interactive behaviors.
This SDK enables you to create behaviors for _Math Square_ by simulating sensor data and displaying behaviors in an Electron browser.
For production, all behaviors must work in Electron on Windows 7.

## Install

### Requirements

* [node+npm](https://nodejs.org/en/download/)

### Installation
Download or clone this repository locally.
On the command line, navigate to the downloaded math-square folder and run
```
npm install
```
This will install all of the necessary dependencies.

## Development

### Behaviors
Conceptually, developing for _Math Square_ is just interactively drawing in an HTML element (usually a canvas) to simulate a new behavior.
Most behaviors are written in [TypeScript](http://typescriptlang.org) or [ES2015](http://www.ecma-international.org/ecma-262/6.0/index.html) JavaScript.
However, they can be written in any [SystemJS](https://github.com/systemjs/systemjs)-compatible JavaScript module format, and use any npm or jspm modules desired.

To create a new behavior, make a file in the [behs](behs) directory that exports a single default `behavior` object that specifies how your behavior will run.
This object can contain the following properties:

* `title` (required): Descriptive name of the behavior
* `init(HTMLDivElement)` (required): initialization function, passed the div element (of proper size) in which to display the behavior.  If it returns a non-null result, it will be used as a `PromiseLike` to delay the start of rendering.
* `render(Floor)`: a function to update the display, passed the current state of the floor sensors and users (see `floor` module).  Called repeatedly forever.
* `frameRate`: How often to call `render`:
    * `undefined`: never
    * `"static"`: only call once at the beginning, for static images; you should probably also set `maxUsers` to `null` in this case.
    * `"sensors"`: call every time there is new sensor data (roughly 20Hz), if the display only changes with people movements
    * `"animate"`: call as often as possible by the browser using `requestAnimationFrame`, ideally at the refresh rate of the display, for real-time animation
    * *fps*: call this many times per second, using `setInterval`
* `maxUsers` [40]: The maximum number of people to track at a time, in `Floor.users`. `0` disables user-tracking (raw sensors only). `null` disables sensors altogether (for non-interactive displays).
* `numGhosts` [0]: If there are not at least this many people on the floor, generate enough fake people to get to this number. These `Floor.Ghost`s move around at random.
* `ghostBounds` [whole floor]: The `Floor.Bounds` space in which ghosts can randomly wander.
* `ghostRate` [0.001]: The speed at which ghosts move.
* `userUpdate(newUsers, deletedUsers, otherUsers)`: A function to call with three arrays of `Floor.User`s each time people are tracked on the floor. The first is users are newly arrived to the floor; the second is users no longer on the floor; the last is users still on the floor.  You only need this if you need special processing when new people are detected on the floor.

A generic TypeScript description of a behavior module is given in [behavior.d.ts](behavior.d.ts).


### Drawing
Unless your behavior is static, a key function will likely be your `render` function, which is called to update the display at each frame.
The `Floor` parameter to `render` will contain the current sensor/user data, which you can use to reactively update the display. `User` (see below) will be an important class for reacting to user movement.

If you have no preference, it is suggested that you use the [p5.js](https://p5js.org/) library for drawing. It will help to look at the [p5-example](behs/p5-example.js) behavior for _Math Square_ and use it as a base template for your own behavior. If you have three-dimensional animation, then you may want to use the [three.js](https://github.com/mrdoob/three.js) library, and use the [debug](behs/debug.ts) behavior as a base template. If you are already comfortable with Canvas2D rendering, you can use that as well, and use [sensors](behs/sensor.ts) as a base template.

### Sensor tracking

While the raw state of each sensor in the grid (post-noise-filtering) is available as described in the `sensors` module (under `floor.sensors`), a convenient abstraction is also provided called "users" or "blobs".
Sets of active sensors are "blobbed" together and treated as single "users" (as described in the `floor` module, i.e., `floor.users`).
Each user is given a unique `id` and tracked as they move across the floor.
This will provide a more convenient interface, but does come at a slight performance cost.

### Modules

The following _Math Square_ modules can be used to help in building behaviors.
A summary of their relevant exports is listed with each.
Feel free to look into the modules' code - particularly p5beh or threectx - to see how the respective modules work.

* `sensors`: Representations for sensor space and sensor grids
    * `width`: the number of sensors horizontally (72)
    * `height`: the number of sensors vertically (72)
    * `Index`: a class for coordinates in sensor space
        * `x`, `y`: the coordinates (read only)
        * `new Index()`: same as `new Index(0, 0)`
        * `new Index(x, y)`: coordinate constructor
        * `new Index(Index)`: copy constructor
        * `incr()`: increment this coordinate in-place, left-to-right and top-to-bottom, returning itself or `undefined` at the end
    * `Grid`: a grid of floor sensors
        * `get(Index)`: get the state of the sensor at the given coordinates (as `0` or non-zero, i.e. off or on)
        * `countBlock(Index, Index)`: counts the number of active sensors in a rectangular region, from upper-left corner (inclusive) to lower-right (exclusive)
* `display`: Representations for the display space
    * `width`: the number of pixels horizontally (576)
    * `height`: the number of pixels vertically (576)
    * `sensorWidth`: the width of a sensor in pixels
    * `sensorHeight`: the height of a sensor in pixels
    * `toSensor(x, y)`: converts from pixel coordinates to the nearest `sensors.Index`
    * `fromSensor(Index)`: converts from sensor coordinates to the nearest pixel
    * `Canvas2DContext`: a class for using `CanvasRenderingContext2D` from behaviors
        * `new Canvas2DContext(HTMLDivElement)`: construct a new canvas and rendering context
        * `context`: The `CanvasRenderingContext2D` for the canvas
* `floor`: Higher-level representation of the current sensor state
    * `User`: a class representing a person being tracked on the floor
        * `id`: their unique, positive integer identifier (negative for ghosts), which attempts to persist while the remain on the floor
        * `x`, `y`: their coordinates in display space
    * `Floor` (default): a class representing the current floor, passed to `Behavior.render`
        * `sensors`: The current `sensors.Grid` raw grid
        * `users`: the list of all active `User`s (only if `maxUsers` is non-zero)
        * `usersByID`: an object mapping from `User.id` to `User` for all active users
    * `Bounds`: `{x: number, y: number, width: number, height: number}`, a type used to specify the bounds that ghost users can move in, numbers specifying the top left corner and dimensions of the bounds in pixels.
* `p5beh`: Support for [P5](https://p5js.org/)-based behaviors (see [example](behs/p5-example.js))
    * `P5Behavior` (default): a class for building a P5 behavior
        * `pb = new P5Behavior((p) => { ... })`: construct a new P5 behavior, passing an optional P5 instantiation function. You can also set the following properties on `pb` as you normally would on `p`, which are also passed the p5 object as `this`:
            * `renderer`: "p2d" (default) or "webgl"
            * `preload = function(p5)`: the p5 `preload` function, like `init`
            * `setup = function(p5)`: the p5 `setup` function
            * `draw = function(floor, p5)`: the p5 `draw` function, like `render`
        * `init`: Use for behavior `init: pb.init.bind(pb)`
        * `render`: Use for behavior `render: pb.render.bind(pb)`
* `threectx`: Useful tools for building behaviors in [three.js](https://github.com/mrdoob/three.js)
    * `THREEContext` (default): a class for managing the default THREE environment
        * `new THREEContext(HTMLDivElement, showBorder = false)`: Create a new `THREE.Scene`, where the z=0 plane map is mapped to the floor using centered pixel coordinates (`-width/2` to `width/2`, `-height/2` to `height/2`)
        * `scene`: the THREE.scene
        * `render()`: update the scene (call from `Behavior.render`)
        * `userUpdate(newUsers, deletedUsers, otherUsers)`: call from `Behavior.userUpdate` with the same arguments if you want to display the users as colored spheres
* `main`:
    * `params`: an object mapping query parameters to values, for convenience if you want to allow some optional arguments to your behavior

### Examples

Code Snippets:
* To loop through each sensor and see if it is on (`floor` is the input parameter to the render function)

    ```javascript
    for(var i = new Sensor.Index(); i; i = i.incr()){
        if (floor.sensors.get(i)){
            console.log('This sensor is enabled');
        }
    }
    ```
* To loop through each user and print each user's coordinates

    ```javascript
    for(let user of floor.users){
        console.log(user.x);
        console.log(user.y);
    }
    ```

Reference behaviors:

* [p5-example](behs/p5-example.js): Display sensors and user blobs (using P5)
* [debug](behs/debug.ts): Display sensors and user blobs (using THREE)
* [sensor](behs/sensor.ts): Display sensors (using 2D canvas)
* [img](behs/img.ts): Display a static image, taking a URL parameter (no sensors)
* [maximal-graph](behs/maximal-graph.js): Build a maximally connected graph from users (using P5)
* [spanning-tree](behs/spanning-tree.js): Build a spanning tree graph from users (using THREE)
* [life](behs/life.ts): Conway's game of life, in sensor space (no user blobbing) (using 2D canvas)

Feel free to look at any of the other behaviors in [behs](behs) for more examples.

### Running

To run your (or any) behavior in Electron, run the following on command line in your math-square folder:

```
npm run-script dev
```

An Electron browser window should open up with two rainbow markers representing the top of the _Math Square_ display, a toolbar at the top, and the console on the right. Then, assuming you've created `behs/my-behavior.js`, enter `my-behavior` in the text box in the toolbar and hit go.
You can refresh (right clicking or keyboard shortcut) to reload the browser for updated behavior files (don't have to reopen Electron each time).

Note: if your behavior is not written in Javascript and your file does not end in .js (e.g. used TypeScript), you have two options. You can either explicitly specify the file extension (enter behavior.ts instead of just behavior into the load bar), or you can edit [config.js](/config.js) by adding a line under `packages.behs.map`. Follow the format of the other .ts behavior files, e.g. `debug`, and add a line for your behavior with the format `"./my-behavior": "behs/my-behavior.ts"`.

### Testing Behavior

One challenge in testing behaviors is simulating the floor sensors. There are a few options for generating fake sensor data, controlled by the sensor drop-down:

* Off: all sensors are off
* Random: generates random sensor clusters
* Recording: plays back a pre-recorded sensor sequence

In addition, there is a checkbox for mouse user simulation. When checked, a user can be simulated by clicking and dragging your mouse on the screen. A small field of sensors will be enabled around your mouse position. This can be used in conjunction with either Off or Random, but not Recording. Do not move the mouse user too fast, as actual people cannot move around the square as fast as your mouse. If you do, the sensors will not register as a user, and this may result in undesired behavior.

#### Recording

The Recording sensor option takes as input a JSON file. The format of the JSON file is an array of arrays, where each inner array represents one frame and contains the sensor indices that *changed* at that frame. We have provided two recordings taken from real _Math Square_ usage that are both ~1 minute long (in the "recordings" directory). This option is especially useful for replicating the exact same behavior each simulation. A status message will be displayed when the recording is finished playing.

You can create your own JSON files by going to the special behavior "record" in Electron. Loading the "record" behavior will open "sensors" to allow you to see which sensors are being toggled during the recording. Set the desired sensor and mouse settings and then click record. You will not be able to change sensor or mouse settings during recording. When done with the recording, simply hit "stop recording". All of the sensor simulation while recording will be saved in a new JSON file that you can then use.

## Production

For production, we produce a `build.js` using `jspm bundle main`.
This is used in [index.html](index.html).
See [generate](generate) for details.

### Configuration

Production configuration is given in `prod.json`, which has the following [keys](prod.d.ts):

* `blserver`: Endpoint URI of a Bright Logic XML floor server. This is necessary to read sensor data from floor hardware, but is optional in dev mode (by using simulated or recorded sensor data instead).
* `imgtoken`: MoMath CMS API token. This is necessary to load proprietary static images from the MoMath CMS. Without it, some static behaviors may be broken.
* `gapikey`: Google API key. This is necessary to read scheduling data from google calendars. Only required in production or scheduler mode.
* `calendar`: One or more google calendar IDs to read scheduling data from. If an array is specified, earlier calendars take precedence. Only required in production or scheduler mode.

### Running

```
npm start
```
