/* MoMath Math Square Display interface
 * Provides a description of the display, defined by an HTMLDivElement of the
 * given dimentions, and common utilities for rendering interfaces.
 */
import * as Sensor from 'sensors';

export const width = 576
export const height = 576

export type Vector = {
  x: number
  y: number
}

export const sensorWidth = width/Sensor.width
export const sensorHeight = height/Sensor.height

/* convert pixel coordinates to sensor Index */
export function toSensor(v: Vector): Sensor.Index;
export function toSensor(x: number, y: number): Sensor.Index;
export function toSensor(x: number|Vector, y?: number): Sensor.Index {
  if (typeof x === 'object') {
    y = x.y;
    x = x.x;
  }
  return new Sensor.Index(
    (x+0.5)/sensorWidth,
    (<number>y+0.5)/sensorHeight);
};

/* convert sensor Index coordinates to pixel coordinates */
export function fromSensor(v: Sensor.Vector): Vector {
  return {
    x:(v.x+0.5)*sensorWidth-0.5,
    y:(v.y+0.5)*sensorHeight-0.5
  };
}

/* same as THREECtx.teamColors but as strings */
export const teamColors = [
  '#393739', '#838385', 
  '#8e1e1f', '#895d1f', 
  '#9c9e5b', '#1f6f25',
  '#1f579f', '#6d1e9f', 
  '#882558', '#9f8353',
  '#704850', '#7c809f'];

abstract class CanvasContext {
  canvas: HTMLCanvasElement

  constructor (container: HTMLDivElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    container.appendChild(this.canvas);
  }
}

export class Canvas2DContext extends CanvasContext {
  context: CanvasRenderingContext2D

  constructor (container: HTMLDivElement) {
    super(container)
    const ctx = this.canvas.getContext('2d');
    if (!ctx)
      throw "Could not get 2D rendering context for canvas";
    this.context = ctx;
  }
}
