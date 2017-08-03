/* MoMath Math Square Behavior interface declaration.
 * TypeScript description of the Behavior interface.
 * All modules in behs/ must provide a default export or "behavior" export
 * that conforms to the Behavior interface.
 */

import Floor from 'floor';
import {User,Bounds} from 'floor';

interface Behavior {
  /* Title of the behavior */
  title: string
  /* Initialize the behavior, which should be displayed inside the passed div element.
   * If a promise is returned, it is awaited before starting rendering; otherwise rendering starts immediately.
   */
  init(container: HTMLDivElement): void|PromiseLike<void>
  /* Update display */
  render?(floor: Floor): void
  /* Rate at which to call render: only once at start; updates per second; browser animation rate; or only with sensor updates */
  frameRate?: 'static'|number|'animate'|'sensors'
  /* Maximum number of users to blob/track. 0 disables blobing (raw floor sensors only), and null disables sensors altogether. */
  maxUsers?: number|null
  /* Minimum number of users: use ghosts to produce at least this many total users */
  numGhosts?: number
  ghostBounds?: Bounds
  ghostRate?: number
  /* Callback whenever tracked sensor users are updated, passed added users, removed users, and remaining users. */
  userUpdate?(newUsers: User[], deletedUsers: User[], otherUsers: User[]): void
}

declare module "behavior" {
  const behavior: Behavior
  // XXX: export default behavior OR export = behavior
}
