/* MoMath Math Square high-level sensor interface
 * Provides and manages the state of the floor, including managing the
 * lower-level sensors interface, providing user blobbing, and "fake" user
 * ghosts.
 */

import * as Sensor from 'sensors';
import * as Display from 'display';
import 'lib/noise';

export class User implements Display.Vector {
  constructor(public id: number, public x: number, public y: number) {
  }
}

export type Bounds = {x: number, y: number, width: number, height: number}

export class Ghost extends User {
  static counter = 1

  private noiseOffsetX: number
  private noiseOffsetY: number
  private noiseX: any
  private noiseY: any

  constructor(public bounds: Bounds = { x: 0, y: 0, width: Display.width, height: Display.height },
	      public noiseRate: number = 0.001) {
    super(-Ghost.counter, 0, 0);
    Ghost.counter++;

    this.bounds = bounds;
    this.noiseRate = noiseRate;
    this.noiseOffsetX = Math.random() * 2000;
    this.noiseOffsetY = Math.random() * 2000;
    this.noiseX = new SimplexNoise();
    this.noiseY = new SimplexNoise();
    this.update();
  }

  update() {
    this.x = this.noiseX.noise(this.noiseOffsetX, this.noiseRate) * (this.bounds.width / 2) + (this.bounds.width / 2) + this.bounds.x;
    this.noiseOffsetX -= this.noiseRate;
    this.y = this.noiseY.noise(this.noiseOffsetY, this.noiseRate) * (this.bounds.height / 2) + (this.bounds.height / 2) + this.bounds.y;
    this.noiseOffsetY -= this.noiseRate;
  }
}

export default class Floor {
  public users: User[] = []
  public usersByID: {[id: number]: User} = {}
  private ghosts?: Ghost[]
  public update?: () => void
  public userUpdate?: (newUsers: User[], deletedUsers: User[], otherUsers: User[]) => void
  public errCallback: (err: string) => void = console.log
  
  private filter: Sensor.FilterSource
  public sensors: Sensor.Grid
  private readonly reader: Sensor.Reader
  private blobber?: Sensor.Blobber

  constructor(source: Sensor.Source) {
    this.filter = new Sensor.FilterSource(
      source,
      /* suppression: 20% permanent or 100% for 40.1s */
      180000, /* suppression time constant (3 minutes) */
      0.2, /* suppression threshold */
      /* activate: 25% permanent or 100% for 0.07ms (~2 samples) */
      250, /* activation time constant (0.25s) */
      0.25 /* activation threshold */
    );
    this.sensors = this.filter;
    this.reader = new Sensor.Reader(this.filter,
      20 /* refresh rate: 20 Hz */
    );
  }

  get source(): Sensor.Source {
    return this.filter.source;
  }

  set source(source: Sensor.Source) {
    this.filter.source = source;
  }

  get maxUsers(): number {
    return this.blobber ? this.blobber.maxBlobs : 0;
  }

  set maxUsers(maxUsers: number) {
    /* blobber and tracker: blob radius (max distance at which to join points), minimum blob size, maximum blob tracking count */
    this.blobber = maxUsers ? new Sensor.Blobber(9, 2, maxUsers) : undefined;
  }

  setGhosts(numGhosts?: number,
            ghostBounds?: Bounds,
            noiseRate?: number) {
    if (numGhosts) {
      this.ghosts = [];
      for (let i = 0; i < numGhosts; i++)
        this.ghosts.push(new Ghost(ghostBounds, noiseRate));
    } else
      delete this.ghosts;
  }

  connect() {
    this.reader.run(this.sensorUpdate.bind(this));
  }

  private sensorUpdate(result: Sensor.Grid|string): number {
      let t = 10; /* wait at least 0.01s */
      if (typeof result === 'string') {
        this.errCallback(result);
        /* treat failed updates as all-off readings */
        this.sensors.data.fill(0);
        if (this.blobber)
          this.setUsers([]);
        t = 500; /* but wait at least 0.5s */
      } else {
        this.sensors = result;
        if (this.blobber){
          this.setUsers(this.blobber.trackBlobs(result).map((b) => {
            var v = Display.fromSensor(b);
            return new User(b.id || 0, v.x, v.y);
          }));
        } 
      }

      if (this.update)
        this.update();

      return t;
  }


  private setUsers(users: User[]) {
    // Update existing users, make new ones, delete ones that are gone
    const idsToDelete: {[id: number]: null} = {},
      newUsers = [], deletedUsers = [], otherUsers = [];

    for (let id in this.usersByID) {
      if (this.ghosts || !(this.usersByID[id] instanceof Ghost))
	       idsToDelete[id] = null;
    }

    if (this.ghosts)
      users = users.concat(this.ghosts.slice(users.length));
    for (let i = 0; i < users.length; i++) {
      let u = users[i];
      let user = this.usersByID[u.id];

      if (user) {
        users[i] = user;
        user.x = u.x;
        user.y = u.y;
        if (user instanceof Ghost)
          user.update();
        otherUsers.push(user);

        // Mark this user as not needing deletion
        delete idsToDelete[user.id];
      }
      else {
        this.usersByID[u.id] = u;
        newUsers.push(u);
      }
    }
    this.users = users;

    for (let id in idsToDelete) {
      const user = this.usersByID[id];
      deletedUsers.push(user);
      delete this.usersByID[id];
    }

    if (this.userUpdate)
      this.userUpdate(newUsers, deletedUsers, otherUsers);
  }
}
