/* MoMath Math Square THREE rendering context
 * Allows using a standard three.js rendering context (scene, camera) in a Behavior.
 * Most original Math Square behaviors were built this way, but newer ones may
 * consider simpler alternatives (P5 or Canvas2D).
 */

import * as Display from 'display';
import * as THREE from 'three';
import {User} from 'floor';

/* same as Display.teamColors but as integers */
export const teamColors = [
  0x393739, 0x838385, 
  0x8e1e1f, 0x895d1f, 
  0x9c9e5b, 0x1f6f25,
  0x1f579f, 0x6d1e9f, 
  0x882558, 0x9f8353,
  0x704850, 0x7c809f];

interface THREEUser extends User {
  node?: THREE.Mesh
  nodeRing?: THREE.Line
  nodeRing2?: THREE.Line
}

export default class THREEContext {
  scene: THREE.Scene
  camera: THREE.Camera
  private renderer: THREE.Renderer

  constructor (container: HTMLDivElement, border?: boolean) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera( Display.width / - 2, Display.width / 2, Display.height / 2, Display.height / - 2, - 2000, 1000 );

    /* is this necessary? */
    this.camera.position.x = Display.width/2;
    this.camera.position.y = Display.height/2;
    this.camera.position.z = -50;
    this.camera.up = new THREE.Vector3(0,-1,0);
    this.camera.lookAt(new THREE.Vector3(Display.width/2,Display.height/2,0));

    this.renderer = new THREE.WebGLRenderer({antialias: true, clearAlpha: 1});
    this.renderer.domElement.addEventListener("webglcontextcreationerror", function (e: any) {
      console.log(e && e.statusMessage || "Unknown webgl error");
    }, false);
    this.renderer.domElement.addEventListener("webglcontextlost", function () {
      console.log("WebGL context lost!");
      location.reload();
    }, false);
    this.renderer.setSize(Display.width, Display.height);
    container.appendChild(this.renderer.domElement);

    if (border) {
      let boundary = new THREE.Geometry();
      boundary.vertices.push(new THREE.Vector3(0,0,50));
      boundary.vertices.push(new THREE.Vector3(Display.width,0,50));
      boundary.vertices.push(new THREE.Vector3(Display.width, Display.height, 50));
      boundary.vertices.push(new THREE.Vector3(0, Display.height, 50));
      boundary.vertices.push(new THREE.Vector3(0, 0, 50))
      let line = new THREE.Line( boundary, new THREE.LineBasicMaterial( { color: 0x888888, opacity: 1, linewidth:3 } ) );
      this.scene.add( line );
    }
  }

  public textures: {[src: string]: THREE.Texture} = {}

  private loadTexture(loader: THREE.TextureLoader, src: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textures[src] = loader.load(src, resolve, undefined, reject);
    });
  }

  public loadTextures(srcs: string[]): Promise<THREE.Texture[]> {
    let loader = new THREE.TextureLoader();
    return Promise.all(srcs.map((src) => this.loadTexture(loader, src)));
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  addUser(user: THREEUser) {
    if (!user.node) {
      user.node = new THREE.Mesh(new THREE.SphereGeometry(12,15,15), new THREE.MeshBasicMaterial({color:user.id >= 0 ? teamColors[user.id%teamColors.length] : 0xffffff}));
      this.scene.add(user.node);
    }
    if (!user.nodeRing) {
      const l = new THREE.Path();
      l.absellipse(0,0,15.5,15.5,0,Math.PI*2, true,0);
      user.nodeRing = new THREE.Line(l.createPointsGeometry(15), new THREE.LineBasicMaterial({color:0x444444,linewidth:3, opacity:0.4}));
      this.scene.add(user.nodeRing);
    }
    if (!user.nodeRing2) {
      const l2 = new THREE.Path();
      l2.absellipse(0,0,15.5,15.5,40,(Math.PI*2)+40, true,0);
      user.nodeRing2 = new THREE.Line(l2.createPointsGeometry(15), new THREE.LineBasicMaterial({color:0x444444,linewidth:3, opacity:0.4}));
      user.nodeRing2.rotation.z = .4 * Math.PI;
      this.scene.add(user.nodeRing2);
    }
    this.updateUser(user);
  }

  updateUser(user: THREEUser) {
    if(user.node) user.node.position.set(user.x, user.y,0);
    if(user.nodeRing) user.nodeRing.position.set(user.x, user.y,0);
    if(user.nodeRing2) user.nodeRing2.position.set(user.x, user.y,0);
  }

  removeUser(user: THREEUser) {
    if (user.node) {
      this.scene.remove(user.node);
      delete user.node;
    }
    if (user.nodeRing) {
      this.scene.remove(user.nodeRing);
      delete user.nodeRing;
    }
    if (user.nodeRing2) {
      this.scene.remove(user.nodeRing2);
      delete user.nodeRing2;
    }
  }

  public userUpdate(newUsers: User[], deletedUsers: User[], otherUsers?: User[]) {
    for (let user of newUsers)
      this.addUser(user);
    for (let user of deletedUsers)
      this.removeUser(user);
    if (otherUsers)
      for (let user of otherUsers)
        this.updateUser(user);
  }
}
