/* MoMath Math Square main entry point
 * This is called from the page's onload handler to load and manage the
 * display, sensors, and behavior main loop.
 */

import Calendar from 'calendar';
import {behaviorsByID} from 'calendar';
import * as Sensor from 'sensors';
import * as Display from 'display';
import Floor from 'floor';
import {User, Bounds} from 'floor';
import * as Behavior from 'behavior';
import {blserver,calendar} from 'prod';

/* import electron, if it's running */
var electron: any
var app: any
System.import("electron").then((mod) => {
  if (!mod)
    return;
  electron = mod;
  app = mod.remote.getGlobal('app');

  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    app.menu.popup(electron.remote.getCurrentWindow())
  }, false);
}, () => { /* no electron */ });

function fatal(msg: any) {
  console.log(msg);
  if (!DEV && app)
    setTimeout(function () {
      app.fatal(msg);
    }, 10000);
}

/* Parse query parameters: "a=b&c&d=" => {a:"b",c:null,d:""} */
export const params: {[key:string]:string|null} = {};
location.search.substr(1).split('&').forEach(function (arg) {
  let kvpair = arg.split('=', 2);
  params[kvpair[0]] = kvpair.length == 2 ? decodeURIComponent(kvpair[1].replace(/\+/g, " ")) : null;
});

export function parseBool(v: any): boolean|undefined {
  if (v == 0 || v === 'off' || v === 'false')
    return false;
  if (v === null || v) /* treat bare parameter with no value as true */
    return true;
}

/* image behaviors (maybe should be in prod.json config instead) */
const imageSrc: {[name:string]:string} = {
  'balloon':            "images/balloon.png", // "Gallery.3276.Image-balloon_maze.png",
  'icemaze':            "images/icemaze.png", // "Gallery.3280.Image-04.ice_maze.png",
  'nltmaze':            "images/nltmaze.png", // "Gallery.3281.Image-NLTMaze.png",
  'customlogo':         "Gallery.3282.Image-customlogo.png",
  'familyfridays':      "Gallery.3513.Image-familyFridays.jpg",
  'mathencounters':     "Gallery.3514.Image-mathEncounters.png",
  'customanimation':    "Gallery.3522.Image-customAnimation.gif",
  'mathmedia':          "images/mathmedia.gif",
};

/* Are we in dev mode */
const DEV = location.pathname.endsWith('/dev.html') || parseBool(params.dev) == true;

export const form = <HTMLFormElement>document.getElementById('form');

/* Construct the autocomplete list of behaviors */
const behaviorList = <HTMLDataListElement>document.getElementById('behavior-list');
function addBehavior(beh: string) {
  const e = document.createElement('option');
  e.setAttribute('value', beh);
  e.appendChild(document.createTextNode(beh));
  behaviorList.appendChild(e);
}
behaviorsByID.forEach(addBehavior);
addBehavior('img');

const msgDiv = <HTMLDivElement>document.getElementById('msg');

function message(id: string, msg?: string) {
  id = 'msg-' + id;
  let box = document.getElementById(id);
  if (!msg) {
    if (box)
      box.remove();
    return;
  }
  if (!box) {
    box = document.createElement('div');
    box.id = id;
    msgDiv.appendChild(box);
  }
  box.innerHTML = "";
  const p = document.createElement('pre');
  p.appendChild(document.createTextNode(msg));
  box.appendChild(p);
}

const scene = <HTMLDivElement>document.getElementById('scene');
scene.style.width = Display.width+'px';
scene.style.height = Display.height+'px';

const xInput = <HTMLInputElement|null>form.elements.namedItem('x');
const yInput = <HTMLInputElement|null>form.elements.namedItem('y');

function positionScene() {
  const
    x = xInput && parseInt(xInput.value) || 0,
    y = yInput && parseInt(yInput.value) || 0;
  scene.style.left = x + 'px';
  scene.style.bottom = y + 'px';
}

if (xInput && yInput) {
  xInput.value = params.x || '0';
  yInput.value = params.y || '0';
  positionScene();
  xInput.onchange = positionScene;
  yInput.onchange = positionScene;
}

/* Main floor sensor interface: used throughout */
export const floor = new Floor(sensorSource(params.sensors || undefined));
floor.errCallback = message.bind(undefined, 'floor');

function sensorSource(src?: string): Sensor.Source {
  switch (src) {
    case 'bl':
      let bl = params.blserver || blserver;
      if (bl)
        return new Sensor.BLSource(bl);
    case 'null':
      return new Sensor.NullSource();
    case 'raindrop':
      return new Sensor.RaindropSource();
    default:
      return sensorSource(DEV ? 'null' : 'bl');
  }
}

/* Sensor source dropdown handler */
const sensorInput = <HTMLSelectElement|null>form.elements.namedItem('sensors');
const mouseCheckBox = <HTMLInputElement>form.elements.namedItem('mouseCheckBox');
if (sensorInput) {
  sensorInput.value = params.sensors || 'null';
  var mouseSource = new Sensor.MouseSource(scene);

  mouseCheckBox.onchange = sensorInput.onchange = function () {
    if (sensorInput.value === 'playback' && playbackInput) {
      playbackInput.style.display = 'inline';
      mouseCheckBox.disabled = true;
      mouseCheckBox.checked = false;
    } else {
      if (playbackInput) {
        playbackInput.style.display = 'none';
        mouseCheckBox.disabled = false;
      }
    }
    var source = sensorSource(sensorInput.value);
    if (mouseCheckBox.checked) {
      mouseSource.source = source;
      source = mouseSource;
      mouseSource.start();
    } else
      mouseSource.stop();
    floor.source = source;
  };
}

const playbackInput = <HTMLInputElement|null>form.elements.namedItem('playback');
if (playbackInput) {
  if (sensorInput.value === 'playback') {
    playbackInput.style.display = 'inline';
    mouseCheckBox.disabled = true;
    mouseCheckBox.checked = false;
  }
  playbackInput.onchange = function () {
    const f = playbackInput.files && playbackInput.files[0];
    if (!f)
      return;
    const r = new FileReader();
    r.onload = function () {
      document.addEventListener('playbackDone', function resetSource(){
        floor.source = sensorSource('null');
        document.removeEventListener('playbackDone', resetSource);
      });
      floor.source = new Sensor.PlaybackSource(r.result, floor);
    };
    r.readAsText(f);
    playbackInput.value = '';
  };
}

/* Sensor recording (for beh=record) */
var recording: Sensor.RecordSource|undefined

const recordControls = document.getElementById('recording');
if (recordControls) {
  addBehavior('record');
  const recordButton = <HTMLInputElement>form.elements.namedItem('record');
  recordButton.onclick = function () {
    if (recording) {
      floor.source = recording.source;
      mouseCheckBox.disabled = false;
      if (sensorInput.value === 'playback') {
        playbackInput.style.display = 'inline';
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(recording.recording)], {type:"application/json"}));
      recording = undefined;
      recordButton.value = 'record';
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.json';
      a.appendChild(document.createTextNode('save'));
      a.onclick = function () {
        setTimeout(function () {
            if (recordControls)
              recordControls.removeChild(a);
            URL.revokeObjectURL(url);
          }, 1000);
        return true;
      };
      if (recordControls)
        recordControls.appendChild(a);
      try {
        a.click();
      } catch (e) {
      }
    } else {
      floor.source = recording = new Sensor.RecordSource(floor.source);
      recordButton.value = 'stop recording';
      mouseCheckBox.disabled = true;
      if (sensorInput.value === 'playback') {
        playbackInput.style.display = 'none';
      }
    }
    if (sensorInput)
      sensorInput.disabled = !!recording;
  };
}

let loaded: string|undefined

function run(beh: typeof Behavior) {
  const prog = (<any>beh).default || beh.behavior;
  if (!prog)
    return message('run', "Invalid behavior");
  message('run', "Loaded " + prog.title + " (" + loaded + ")");
  document.title += ": " + prog.title;

  const then = () => {
    floor.maxUsers = prog.maxUsers === undefined ? 40 : prog.maxUsers;
    floor.setGhosts(
      prog.numGhosts,
      prog.ghostBounds,
      prog.ghostRate);
    if (prog.userUpdate)
      floor.userUpdate = prog.userUpdate;

    if (prog.maxUsers !== null)
      floor.connect();

    let render: (() => void)|undefined;
    /* profile interval for frame counting */
    const prof = params.prof === null ? 15 : parseInt(params.prof || '');
    let count = 0;
    if (prof) {
      setInterval(() => {
	console.log(count/prof+"/s");
	count = 0;
      }, 1000*prof);
      if (prog.render)
	render = () => {
	  count++;
	  prog.render(floor);
	};
    } else if (prog.render)
      render = prog.render.bind(prog, floor);

    if (!render || !prog.frameRate)
      return;
    switch (prog.frameRate) {
      case 'static':
	render();
        break;
      case 'animate':
      case 'animation':
        const frame = () => {
	  if (render)
	    render();
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        break;
      case 'sensor':
      case 'sensors':
      case 'floor':
        floor.update = render;
        break;
      default:
	setInterval(render, 1000/prog.frameRate);
    }
  };
  const handle = (e: any) => {
    message('run', "Loading: " + e);
    fatal(e);
  };

  try {
    const init = prog.init(scene);
    return init ? init.then(then).catch(handle) : then();
  } catch (e) {
    handle(e);
  }
}

const behInput = <HTMLInputElement>form.elements.namedItem('beh');

/* temporary until electron#360 fixed (remember to remove css, too) */
import Awesomplete from 'awesomplete';
new Awesomplete(behInput, {minChars: 0, maxItems: 12, sort: false, filter: Awesomplete.FILTER_STARTSWITH});

function load(prog: string|undefined|null, src?: string) {
  if (!prog)
    return;
  prog = prog.toLowerCase();
  behInput.value = prog;
  if (loaded) {
    if (prog != loaded) {
      behInput.disabled = false;
      form.submit();
    }
    return;
  }
  loaded = prog;
  if (prog in imageSrc) {
    params.src = imageSrc[prog];
    prog = 'img';
  } else if (src)
    params.src = src;
  System.import("behs/" + prog).then(run, message.bind(undefined, 'run'));
}

var nosched = params.nosched === undefined ? DEV : parseBool(params.nosched) == true;
const noschedInput = <HTMLInputElement|null>form.elements.namedItem('nosched');
if (noschedInput) {
  behInput.disabled = !nosched;
  noschedInput.checked = nosched;
  noschedInput.onchange = function () {
    behInput.disabled = !noschedInput.checked;
  };
}

var prog = params.beh || params.prog || params.game;
behInput.value = prog || '';

if (prog == 'calendar' || prog == 'schedule') {
  nosched = false;
  prog = null;
}

if (DEV && prog === 'record' && recordControls) {
  prog = 'sensor';
  recordControls.style.display = 'inline';
}

load(prog);

if (!nosched) {
  message('now', "Loading calendar...");
  new Calendar(calendar, 120,
    function (ev) {
      load(ev.behavior, ev.location);
      message('now', 'Now: ' + ev.name + ' (' + ev.behavior + ')' + '\nNext in: ' + ev.friendlyLeft());
    }, function(err) {
      message('cal', 'Error loading calendar: ' + err);
    });
}
