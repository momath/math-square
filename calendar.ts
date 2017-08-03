/* MoMath Math Square Scheduler
 * Handles scheduling behaviors for the production exhibit based on google calendars.
 */

import {gapikey} from 'prod';

export const behaviorsByID = [
  /*  0 */ 'debug',
  /*  1 */ 'shape-blaster',
  /*  2 */ 'reaction-diffusion',
  /*  3 */ 'sticks-stones',
  /*  4 */ 'sokoban',
  /*  5 */ 'fractal',
  /*  6 */ 'spanning-tree',
  /*  7 */ 'traveling-salesman',
  /*  8 */ 'voronoi-color',
  /*  9 */ 'voronoi-team',
  /* 10 */ 'balloon',
  /* 11 */ 'icemaze',
  /* 12 */ 'nltmaze',
  /* 13 */ 'customlogo',
  /* 14 */ 'blackscreen',
  /* 15 */ 'familyfridays',
  /* 16 */ 'mathencounters',
  /* 17 */ 'customanimation',
  /* 18 */ 'unit-disk-graph',
  /* 19 */ 'mathmedia',
  /* 20 */ 'momath-logo',
  /* 21 */ 'life',
  /* 22 */ 'gravity',
  /* 23 */ 'maximal-graph',
];

const fallback = ['nltmaze', 'sokoban', 'balloon', 'voronoi-color', 'icemaze', 'spanning-tree'];
const fallbackDuration = 20*60*1000; // 20 minutes

class Event {
  name: string
  behavior?: string
  location?: string
  start: Date
  end: Date
  current: boolean
  left: number

  constructor(at: Date = new Date(), ev?: gapi.client.calendar.Event, end?: Date) {
    if (ev) {
      this.name = ev.summary.trim();
      /* numeric locations map to behaviorsByID */
      const id = parseInt(ev.location || '');
      if (id in behaviorsByID)
	this.behavior = behaviorsByID[id];
      /* otherwise try to interpret the summary as a behavior */
      else if (/^[-0-9a-z_]+$/i.test(this.name)) {
	this.behavior = this.name;
	/* location gets passed along as src (for images) */
	if (ev.location)
	  this.location = ev.location.trim();
      }

      this.start = new Date(ev.start.dateTime || '');
      this.end   = new Date(ev.end  .dateTime || '');
    } else {
      const t = at.getTime();
      const o = t % fallbackDuration;
      const w = Math.floor(t / fallbackDuration) % fallback.length;
      const s = t - o;
      this.name = this.behavior = fallback[w];
      this.start = new Date(s);
      this.end = new Date(s + fallbackDuration);
      this.current = true;
      this.left = s + fallbackDuration - t;
    }
    if (end && end < this.end)
      this.end = end;
    this.current = this.start <= at && at < this.end;
    this.left = this.end.getTime() - at.getTime();
  }

  friendlyLeft(): string {
    const
      seconds = this.left / 1000,
      hours = Math.floor(seconds / 60 / 60),
      minutes = Math.floor(seconds / 60) % 60,
      hourWord = hours + ' hour' + (hours > 1 ? 's' : ''),
      minuteWord = minutes + ' minute' + (minutes > 1 ? 's' : '');

    if (hours) {
      let s = hourWord;
      if (minutes)
        s += ' and ' + minuteWord;
      return s;
    }
    if (minutes)
      return minuteWord;
    return 'less than a minute';
  }
}

export default class Calendar {
  public calendars: string[] = []
  private interval: number

  constructor(cal: string[]|string|undefined,
              checkIntervalSeconds: number = 60,
              public update: (prog: Event) => void,
              public error: (err: string) => void = console.log) {
    if (cal) {
      if (!Array.isArray(cal))
	cal = [cal];
      this.calendars = cal;
    }
    this.interval = 1000*checkIntervalSeconds;
    this.check = this.check.bind(this);
    this.check();
  }

  private now: Date

  private getEvent(cal: string, end?: Date): Promise<Event|undefined> {
    return gapi.client.calendar.events.list({
      calendarId: cal,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: this.now.toISOString(),
      timeMax: end && end.toISOString(),
      maxResults: 1
    }).then<Event|undefined>(r => {
      if (r.result.items.length)
        return new Event(this.now, r.result.items[0], end);
    });
  }

  private findEvent(cals: string[], next?: Event): Promise<Event|undefined> {
    const cal = cals.shift();
    return cal ? this.getEvent(cal, next && next.start).then(e => {
      /* if this event is happening now, take it */
      if (e && e.current)
        return e;
      /* if not, move on to the next calendar, but keep the soonest starting event to fall back to */
      return this.findEvent(cals, e && (!next || e.start < next.start) ? e : next);
    }) : Promise.resolve(next);
  }

  private gotEvent(e: Event = new Event()) {
    this.update(e);
    let t = this.interval;
    if (e && e.left < t)
      t = e.left;
    setTimeout(this.check, t);
  }

  private fail(msg: string) {
    this.error(msg);
    this.gotEvent();
  }

  private check(): void {
    if (!this.calendars.length)
      return this.fail("No calendars configured");
    if (!(<any>window).gapi) {
      System.import("gapi").then(this.check, () => {
          this.fail("Could not load gapi!");
        });
      return;
    }
    if (!gapi.client)
      return gapi.load('client', this.check);
    if (!gapi.client.calendar) {
      gapi.client.init({
          'apiKey': gapikey,
          'discoveryDocs': ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
        }).then(() => {
          this.check();
        }, (err) => {
          setTimeout(this.check, this.interval);
        });
      return;
    }
    this.now = new Date();
    this.findEvent(this.calendars.slice()).then((e) => {
	if (!e)
	  this.fail("No scheduled events");
	else if (!e.behavior)
	  this.fail('Unknown event: ' + e.name + ' (' + e.location + ')');
	else
	  this.gotEvent(e);
      });
  }
}
