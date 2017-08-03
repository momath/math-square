/* MoMath Math Square Behavior
 *
 *        Title: Image
 *  Description: Display a static image
 * Scheduler ID: multiple (see scheduler.ts)
 *    Framework: none
 *       Author: Dylan Simon <dylan@dylex.net>
 *      Created: 2017-03, generalized from existing images
 *      Updated: 2017-04 for SDK by dylan
 *       Status: works
 */

import {Behavior} from 'behavior';
import {params, form} from 'main';
import * as Display from 'display';
import {imgtoken} from 'prod';

function init(container: HTMLDivElement) {
  var src = params.src;
  const img = document.createElement('img');
  img.width = Display.width;
  img.height = Display.height;

  (document.getElementById('src') as HTMLLabelElement).style['visibility'] = 'visible';
  if (src) {
    (form.elements.namedItem('src') as HTMLInputElement).value = src;
    if (src.indexOf("/") == -1) {
      src = "http://api.momath.org/api/v1/content/exhibit-blob/MASQ.OD.Graphics/00000000-0000-0000-0000-000000000000/" + src;
      if (imgtoken)
	src += "?tok=" + imgtoken;
    }
    img.src = src;
  }

  container.appendChild(img);
}

export const behavior: Behavior = {
  title: "Static Image: " + params.src,
  maxUsers: null, /* disable sensors */
  init: init
  /* no rendering */
};
export default behavior
