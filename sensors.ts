/* MoMath Math Square low-level sensors
 * Describes the sensor space and provides utilites to sample, filter, generate, record, blob, and track sensor readings.
 */

const W = 72;
const H = 72;
const N = W * H;

export const width = W
export const height = H

export interface Vector {
  readonly x: number
  readonly y: number
}

/* An vector in grid space, possibly negative */
export class Coord implements Vector {
  x: number
  y: number
  o: number

  constructor();
  constructor(p: Coord);
  constructor(o: number);
  constructor(x: number, y: number);
  constructor(x?: any, y?: number) {
    if (x instanceof Coord) {
      this.x = x.x
      this.y = x.y
      this.o = x.o
    } else if (y != null) {
      this.x = x|0;
      this.y = y|0;
      if (this.x > -W && this.x < W) {
        this.o = this.y*W + this.x;
      }
    } else {
      this.o = x|0;
      this.x = this.o%W;
      this.y = (this.o-this.x)/W;
    }
  }

  incr(): this|undefined {
    this.x ++;
    this.o ++;
    return this;
  }

  get abs2(): number {
    return this.x*this.x + this.y*this.y;
  }
}

/* An index in the grid */
export class Index extends Coord {
  constructor();
  constructor(p: Coord);
  constructor(o: number);
  constructor(x: number, y: number);
  constructor(x?: any, y?: number) {
    super(x, <number>y);
    if (this.x < 0)
      this.o = NaN;
  }

  get valid(): boolean {
    return this.o >= 0 && this.o < N;
  }

  incr(): this|undefined {
    super.incr();
    if (this.x >= W) {
      if (this.o >= N)
        return undefined;
      this.x = 0;
      this.y ++;
    }
    return this;
  }

  add(p: Coord): this {
    this.x += p.x;
    this.y += p.y;
    this.o += p.o;
    if (this.x >= W || this.x < 0) {
      this.o = NaN;
    } else if (this.x < 0) {
      this.x += W;
      this.y --;
    }
    return this;
  }

  plus(p: Coord): Index {
    return (new Index(this)).add(p);
  }
}

/* Generate the list of coordinates making up a disc of radius d, starting with (0,0) */
function disc(d: number): Coord[] {
  const n = Math.floor(d);
  if (n < 0 || n >= W)
    throw "Radius too large";
  const dd = d*d;
  const r: Coord[] = [];
  function add(x: number, y: number): void {
    r.push(new Coord(x, y));
  }
  function addx(x: number, y: number): void {
           add( x, y);
    if (x) add(-x, y);
  }
  function addxy(x: number, y: number): void {
           addx(x,  y);
    if (y) addx(x, -y);
  }
  add(0,0);
  for (let i = 1; i <= n; i ++) {
    addx(i, 0);
    addxy(0, i);
  }
  for (let y = 1; y <= n; y ++) {
    const yy = y*y;
    for (let x = 1; x <= n; x ++) {
      if (yy + x*x > dd)
        break;
      addxy(x, y);
    }
  }
  return r;
}

/* A two-dimensional WxH array of values, indexable by Index, implemented by a TypedArray */
abstract class TypedGrid {
  protected readonly constr: TypedArrayConstructor
  readonly data: TypedArray

  constructor(grid?: TypedGrid) {
    this.data = grid ? new this.constr(grid.data) : new this.constr(N);
  }

  /* Get the value at index (or undefined if out of range) */
  get(p: Index): number|undefined {
    return this.data[p.o];
  }

  /* Set a value at index, returning the value (or undefined if out of range) */
  set(p: Index, v: number): number|undefined {
    this.data[p.o] = v;
    return this.data[p.o];
  }

  /* Replace all data in this grid with zeros */
  clear() {
    this.data.fill(0);
  }

  /* Replace the data in this grid with data from another grid */
  copyFrom(grid: TypedGrid) {
    this.data.set(grid.data);
  }

  /* Create a new typed-array with all the values from a rectangular region bounded by corners [inclusive-start, end-exclusive) */
  private subblock(start: Index, end: Index): TypedArray[] {
    let l = [];
    let w = end.x - start.x;
    for (let o = start.o; o < end.o; o += W)
      l.push(this.data.subarray(o, o+w));
    return l;
  }

  /* Test if the given predicate is satisfied by any value in a rectangular subregion */
  someBlock(callback: (value: number) => boolean, start: Index, end: Index, thisArg?: any): boolean {
    for (let r of this.subblock(start, end))
      if (r.some(callback, thisArg))
        return true;
    return false;
  }

  reduceBlock<A>(callback: (previousValue: A, currentValue: number) => A, initialValue: A, start: Index, end: Index): A {
    let x = initialValue;
    for (let r of this.subblock(start, end))
      x = r.reduce(callback, x);
    return x;
  }

  sumBlock(start: Index, end: Index): number {
    return this.reduceBlock((a,b) => a+b, 0, start, end);
  }

  countBlock(start: Index, end: Index): number {
    return this.reduceBlock((a,b) => b>0 ? a+1 : a, 0, start, end);
  }
}

type GridDiff = number[]|number|null

class ByteGrid extends TypedGrid {
  protected get constr() {
    return Uint8ClampedArray;
  }
  /* Produce a symmetric list of differences between two boolean grids */
  diff(grid: ByteGrid): GridDiff {
    let r = [];
    for (let o = 0; o < N; o++)
      if (grid.data[o] != this.data[o])
        r.push(o);
    return r.length == 1 ? r[0] : r;
  }
  /* Toggle the values from a list of differences:
   * a.apply(a.diff(b)) => b for all boolean grids a, b */
  apply(diff: GridDiff|undefined) {
    if (typeof diff === 'number')
      diff = [diff];
    if (Array.isArray(diff))
      for (let o of diff)
        this.data[o] = this.data[o] ? 0 : 1;
  }
}

export class UIntGrid extends TypedGrid {
  protected get constr() {
    return Uint16Array;
  }
}

class FloatGrid extends TypedGrid {
  protected get constr() {
    return Float32Array;
  }
}

class DoubleGrid extends TypedGrid {
  protected get constr() {
    return Float64Array;
  }
}

export type Grid = ByteGrid
type Recording = GridDiff[]

/* A source (generator) for T values */
interface TSource<T> {
  read(): Promise<T>
}

/* Simple source constructor */
function Source<T>(src: () => Promise<T>): TSource<T> {
  return { read: src };
}

/* Take a list of sources, using each one up until it produces an error. */
class ChainSource<T> extends Array<TSource<T>> implements TSource<T> {
  read(): Promise<T> {
    switch (this.length) {
      case 0:
        return Promise.reject("ChainSource: empty");
      case 1:
        return this[0].read();
      default:
        return this[0].read().catch(() => {
          this.shift();
          return this.read();
        });
    }
  }
}

/* The type of sensor readers: a sensor grid generator */
export type Source = TSource<Grid>

/* Always produce the same (empty) grid */
export class NullSource extends ByteGrid implements Source {
  read() {
    // this.clear();
    return Promise.resolve(this);
  }
}

/* Populate a grid from a bright logic XML server */
export class BLSource extends ByteGrid implements Source {
  constructor(public url: string) {
    super();
  }

  read() {
    return new Promise((resolve, reject) => {
      const q = new XMLHttpRequest();
      q.addEventListener("loadend", () => {
        if (q.readyState != 4 || q.status != 200)
          return reject("GET " + this.url + ": " + (q.statusText || q.status));
        const s = q.responseXML as any;
        if (!s || s.contentType != "text/xml")
          return reject("content " + (s && s.contentType));
        let e = s.documentElement as Element|null;
        if (!e || e.tagName != "BLFloor")
          return reject("XML " + (e && e.tagName));
        if (e.getAttribute("sensorsX") != <any>W || e.getAttribute("sensorsY") != <any>H)
          return reject("size " + e.getAttribute("sensorsX") + "," + e.getAttribute("sensorsY"));
        e = e.firstElementChild;
        if (!e || e.tagName != "Rows")
          return reject("rows " + (e && e.tagName));
        if (e.childElementCount != H)
          return reject("row count " + e.childElementCount);
        const l = e.childNodes as NodeListOf<Element>;
        let i = 0;
        for (let y = 0; y < H; y ++) {
          const r = l[y];
          if (r.tagName != "Row" || r.getAttribute("rownum") != <any>y)
            return reject("row " + y + " " + r.tagName + " " + r.getAttribute("rownum"));
          const v = r.getAttribute("values") || "";
          const s = v.split(",");
          if (s.length != W)
            return reject("row " + y + " " + v);
          for (let x = 0; x < W; x ++)
            this.data[i++] = +(s[x] === '*');
        }
        return resolve(this);
      });
      try {
        q.open("GET", this.url);
        q.send();
      } catch (e) {
        return reject("GET " + this.url + ": " + e.toString());
      }
    });
  }
}

/* A transparent source filter that records all readings in the recording property */
export class RecordSource implements Source {
  public recording: Recording = []
  private last = new ByteGrid()

  constructor(public source: Source) {
  }

  read(): Promise<Grid> {
    return this.source.read().then((input) => {
      this.recording.push(input.diff(this.last));
      this.last.copyFrom(input);
      return input;
    });
  }
}

/* Playback a Recording from RecordSource */
export class PlaybackSource extends ByteGrid implements Source {
  public recording: Recording

  constructor(recording: Recording|string) {
    super();
    if (typeof recording === 'string')
      recording = JSON.parse(recording);
    if (Array.isArray(recording))
      this.recording = recording;
    else
      throw "Invalid recording";
  }

  get remaining(): number {
    return this.recording.length;
  }

  read() {
    if (!this.recording.length){
      var doneEvent = new CustomEvent("playbackDone");
      document.dispatchEvent(doneEvent);
      return Promise.reject("PlaybackSource: recording finished");
    }
    const frame = this.recording.shift();
    this.apply(frame);
    return Promise.resolve(this);
  }
}

export class RaindropSource extends ByteGrid implements Source {
  constructor() {
    super();
  }

  private pop = 0

  read() {
    const
      b0 = new Coord(-1,-1),
      b1 = new Coord(+1,+1),
      t = this.pop / 80,
      t0 = t,               /* kill if < t0 */
      tc = (19+t)/20,       /* leave if < tc */
      t1 = (49999+t)/50000; /* cluster if < t1 */
                            /* vivify otherwise */
    let p = 0;
    for (let i: Index|undefined = new Index(); i; i = i.incr()) {
      const r = Math.random();
      if (r < t0)
        this.set(i, 0);
      else if (r < tc) {
        p += <number>this.get(i);
      } else if (r < t1) {
        const c = this.sumBlock(i.plus(b0), i.plus(b1));
        if (c > 0 && c < 6) {
          this.set(i, 1);
          p ++;
        } else if (c > 6)
          this.set(i, 0);
        else
          p += <number>this.get(i);
      } else {
        this.set(i, 1);
        p ++;
      }
    }
    this.pop = p;
    return Promise.resolve(this);
  }
}

/* filtering is done by exponentially smoothing input using both sup(ression) and act(ivation) parameters.
 * Values must exceed act and not exceed sup. */
export class FilterSource extends ByteGrid implements Source {
  private readonly sup = new DoubleGrid()
  private readonly act = new DoubleGrid()
  private last = 0

  constructor(public source: Source,
              public supTau: number, /* suppression 1/e time constant */
              public supThresh: number, /* suppression threshold */
              public actTau: number, /* activation 1/e time constant */
              public actThresh: number /* activation threshold */
             ) {
    super();
  }

  read(): Promise<this> {
    return this.source.read().then((input) => {
      /* b = 1-alpha */
      const t = Date.now();
      const dt = t - this.last;
      this.last = t;
      const sb = Math.exp(-dt/this.supTau);
      const ab = Math.exp(-dt/this.actTau);
      for (let i = 0; i < N; i++) {
        this.sup.data[i] = sb*this.sup.data[i] + (1-sb)*input.data[i];
        this.act.data[i] = ab*this.act.data[i] + (1-ab)*input.data[i];
        this.data[i] = +(this.sup.data[i] <= this.supThresh && this.act.data[i] >= this.actThresh);
      }
      return this;
    });
  }
}

export class MouseSource extends ByteGrid implements Source, EventListenerObject {
  private static readonly events = ['mouseup', 'mousedown', 'mousemove', 'mouseenter', 'mouseleave'];
  private static readonly blob = disc(1);
  private mouseIndex: Index|undefined

  constructor(private scene: HTMLElement, public source?: Source|null) {
    super();
  }

  start() {
    this.mouseIndex = undefined;
    for (let e of MouseSource.events)
      this.scene.addEventListener(e, this);
  }

  stop() {
    for (let e of MouseSource.events)
      this.scene.removeEventListener(e, this);
    this.mouseIndex = undefined;
  }

  handleEvent(ev: MouseEvent) {
    if ((ev.type === 'mousedown' || ev.type === 'mousemove' || ev.type === 'mouseenter') && ev.buttons & 1) {
      const rect = this.scene.getBoundingClientRect();
      this.mouseIndex = new Index(
        W*(ev.clientX - rect.left)/rect.width,
        H*(ev.clientY - rect.top )/rect.height);
    } else
      this.mouseIndex = undefined;
  }

  read(): Promise<Grid> {

    const f = (input?: Grid) => {
      if (input) {
        if (!this.mouseIndex)
          return input;
        this.copyFrom(input);
      } else
        this.clear();

      if(this.mouseIndex){
        for(let coord of MouseSource.blob){
          this.set(this.mouseIndex.plus(coord), 1);
        }
      }

      return this;
    };

    return this.source ? this.source.read().then(f) : Promise.resolve(f());
  }
}

export class Reader {
  interval: number

  constructor(public source: Source,
              rate: number, /* target refresh rate, Hz */
             ) {
    this.interval = 1000/rate;
  }

  /* Loop forever loading the floor, calling the handler each time there's new data or an error.
   * Stop when handler returns 0. */
  public run(handler: (result: Grid|string) => number): void {
    let next: number;

    const run = () => {
      next = Date.now() + this.interval;
      this.source.read().then((input) => {
          let wait = handler(input);
          return wait && Math.max(wait, next - Date.now());
        }, (err) => {
          return handler("Sensors.read: " + err);
        }).then((wait) => {
          if (wait)
            setTimeout(run, wait);
        });
    };

    run();
  }
}

/* A collection of points represented by their centroid */
class Blob implements Vector {
  id: number|undefined
  private xs = 0
  private ys = 0
  size: number = 0

  add(p: Vector): void {
    this.xs += p.x;
    this.ys += p.y;
    this.size += p instanceof Blob ? p.size : 1;
  }

  get x(): number {
    return this.xs/this.size;
  }
  get y(): number {
    return this.ys/this.size;
  }
}

export class Blobber {
  /* area to search over for nearby points in blob */
  private readonly mask: Coord[]
  private blobs: Blob[] = []
  /* continuously increasing blob id index */
  private count = 0

  constructor(dist: number, /* blobbing distance */
              public minSize = 1, /* minimum blob size */
              public maxBlobs = Infinity /* maximum blob count */) {
    this.mask = disc(dist);
    /* remove (0,0) */
    this.mask.pop();
  }

  /* calculate the blobs for all the 1 values in the grid and label them 2,... */
  private blob(grid: TypedGrid): Blob[] {
    const r = [];
    for (let i: Index|undefined = new Index(); i; i = i.incr()) {
      if (grid.get(i) === 1) {
        const b = new Blob();
        const label = r.push(b)+1;
        const l: Index[] = [];
        const add = (p: Index) => {
          grid.set(p, label);
          b.add(p);
          l.push(p);
        };
        add(i);
        while (l.length) {
          const p = l.shift() as Index;
          for (let m of this.mask) {
            const c = p.plus(m);
            if (grid.get(c) === 1)
              add(c);
          }
        }
      }
    }
    return r;
  }

  /* greedily find closest blobs, starting with the first (i.e., largest), and assign their ids */
  private track(blobs: Blob[]): void {
    const l = [];
    for (let c of blobs) {
      for (let p of this.blobs) {
        const xd = c.x - p.x;
        const yd = c.y - p.y;
        l.push({c:c, p:p, d:xd*xd+yd*yd});
      }
    }
    l.sort(function(a, b) { return a.d - b.d; });
    for (let i of l)
      if (i.p.id && !i.c.id) {
        i.c.id = i.p.id;
        i.p.id = undefined;
      }
    for (let c of blobs)
      if (!c.id)
        c.id = ++this.count;
    this.blobs = blobs;
  }

  trackBlobs(grid: TypedGrid): Blob[] {
    const r = this.blob(grid);
    r.sort((a, b) => b.size - a.size);
    const m = r.findIndex((b, i) => b.size < this.minSize || i >= this.maxBlobs);
    if (m >= 0)
      r.splice(m);
    this.track(r);
    return r;
  }
}
