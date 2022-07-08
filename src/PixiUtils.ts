import * as PIXI from 'pixi.js';
import { clone, Vec2 } from './Vec';
import { View } from './views';
import * as math from './math';
import * as config from './config';
import { keyDown } from './ui/eventListeners';
import { SCALE_MODES } from 'pixi.js';
import * as colors from './ui/colors';
import { JSpriteAnimated } from './Image';

// if PIXI is finished setting up
let isReady = false;
// Ensure textures stay pixelated when scaled:
PIXI.settings.SCALE_MODE = SCALE_MODES.NEAREST;
// PIXI app
export const app = new PIXI.Application();
export const containerBoard = new PIXI.Container();
export const containerBetweenBoardAndWalls = new PIXI.Container();
export const containerWalls = new PIXI.Container();
export const containerBloodSmear = new PIXI.Container();
export const containerPlanningView = new PIXI.Container();
export const containerDoodads = new PIXI.Container();
export const containerUnits = new PIXI.Container();
export const containerSpells = new PIXI.Container();
export const containerProjectiles = new PIXI.Container();
export const containerUI = new PIXI.Container();
export const containerPlayerThinking = new PIXI.Container();
export const containerUIFixed = new PIXI.Container();
export const containerFloatingText = new PIXI.Container();

// debug: Draw caves
window.debugCave = new PIXI.Graphics();
containerUI.addChild(window.debugCave);
window.devDebugGraphics = new PIXI.Graphics();
window.devDebugGraphics.lineStyle(3, 0x0000ff, 1.0);
containerUI.addChild(window.devDebugGraphics);

const underworldPixiContainers = [
  containerBoard,
  containerBetweenBoardAndWalls,
  containerWalls,
  containerBloodSmear,
  containerPlanningView,
  containerDoodads,
  containerUnits,
  containerSpells,
  containerProjectiles,
  containerPlayerThinking,
  containerUI,
  containerUIFixed,
  containerFloatingText,
];

export const graphicsBloodSmear = new PIXI.Graphics();
containerBloodSmear.addChild(graphicsBloodSmear);

const elPIXIHolder: HTMLElement = document.getElementById('PIXI-holder') as HTMLElement;
const elCardHand = document.getElementById('card-hand') as HTMLElement;
const elHealthMana = document.getElementById('health-mana') as HTMLElement;
window.debugGraphics = new PIXI.Graphics();
containerUI.addChild(window.debugGraphics);
window.unitOverlayGraphics = new PIXI.Graphics();
containerUI.addChild(window.unitOverlayGraphics);
window.thinkingPlayerGraphics = new PIXI.Graphics();
window.radiusGraphics = new PIXI.Graphics();
const colorMatrix = new PIXI.filters.AlphaFilter();
colorMatrix.alpha = 0.2;
window.radiusGraphics.filters = [colorMatrix];
containerBetweenBoardAndWalls.addChild(window.radiusGraphics);


app.renderer.backgroundColor = colors.abyss;

window.addEventListener('resize', resizePixi);
window.addEventListener('load', () => {
  resizePixi();
});
export function resizePixi() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
}
let camera: Vec2 = { x: 0, y: 0 };
// True if camera should auto follow player unit
let doCameraAutoFollow = true;
// Initialize with camera following player:
// It is important that doCameraAutoFollow is changed only
// in cameraAutoFollow so that the body's class can change with it.
cameraAutoFollow(true);

// withinCameraBounds takes a Vec2 (in game space) and returns a 
// Vec2 that is within the bounds of the camera so that it will 
// surely be seen by a user even if they have panned away.
// Used for attention markers and pings
export function withinCameraBounds(position: Vec2, marginHoriz?: number): Vec2 {
  const cardHandRect = elCardHand.getBoundingClientRect();
  const healthManaRect = elHealthMana.getBoundingClientRect();
  const pixiHolderRect = elPIXIHolder.getBoundingClientRect();
  // cardHand has padding of 300px to allow for a far right drop zone,
  // this should be taken into account when keeping the attention marker
  // outside of the cardHoldersRect bounds
  const cardHandPaddingRight = 300;
  const { x: camX, y: camY, zoom } = getCamera();
  // Determine bounds
  const margin = (marginHoriz !== undefined ? marginHoriz : 30) / zoom;
  const marginTop = 45 / zoom;
  const marginBottom = 45 / zoom;
  const left = margin + camX / zoom;
  const right = window.innerWidth / zoom - margin + camX / zoom;
  const top = marginTop + camY / zoom;
  const bottom = elPIXIHolder.clientHeight / zoom - marginBottom + camY / zoom;

  // Debug draw camera limit
  // window.unitOverlayGraphics.lineStyle(4, 0xcb00f5, 1.0);
  // window.unitOverlayGraphics.moveTo(left, top);
  // window.unitOverlayGraphics.lineTo(right, top);
  // window.unitOverlayGraphics.lineTo(right, bottom);
  // window.unitOverlayGraphics.lineTo(left, bottom);
  // window.unitOverlayGraphics.lineTo(left, top);

  // Keep inside bounds of camera
  const withinBoundsPos: Vec2 = {
    x: Math.min(Math.max(left, position.x), right),
    y: Math.min(Math.max(top, position.y), bottom)
  }
  // window.unitOverlayGraphics.drawCircle(camX / zoom, camY / zoom, 4);
  // window.unitOverlayGraphics.drawCircle(cardHandRight, cardHandTop, 8);

  // Don't let the attention marker get obscured by the cardHolders element
  const cardHandRight = (cardHandRect.width + (camX - cardHandPaddingRight)) / zoom;
  const cardHandTop = (cardHandRect.top - pixiHolderRect.top + camY) / zoom;
  if (withinBoundsPos.x < cardHandRight && withinBoundsPos.y > cardHandTop) {
    // 32 is arbitrary extra padding for the height of the marker
    withinBoundsPos.y = cardHandTop - 32;
  }
  const healthManaRight = (healthManaRect.width + camX) / zoom;
  const healthManaTop = (healthManaRect.top - pixiHolderRect.top + camY) / zoom;
  if (withinBoundsPos.x < healthManaRight && withinBoundsPos.y > healthManaTop) {
    // 32 is arbitrary extra padding for the height of the marker
    withinBoundsPos.y = healthManaTop - 32;
  }
  return withinBoundsPos;
}

// Used for moving the camera with middle mouse button (like in Dota2)
export function moveCamera(x: number, y: number) {
  camera.x += x;
  camera.y += y;
}

export function isCameraAutoFollowing(): boolean {
  return doCameraAutoFollow;
}
export function cameraAutoFollow(active: boolean) {
  doCameraAutoFollow = active;
  document.body.classList.toggle('auto-camera', active);
}
export function getCamera() {
  return {
    x: -app.stage.x,
    y: -app.stage.y,
    zoom: calculateCameraZoom(),
  }
}
function calculateCameraZoom() {
  return app.stage.scale.x + (window.zoomTarget - app.stage.scale.x) / 8;
}
let lastZoom = window.zoomTarget;
export function updateCameraPosition() {

  // Lerp zoom to target
  // Note: This must happen BEFORE the stage x and y is updated
  // or else it will get jumpy when zooming
  const zoom = calculateCameraZoom();

  app.stage.scale.x = zoom;
  app.stage.scale.y = zoom;

  switch (window.view) {
    case View.Game:
      if (window.player) {
        if (doCameraAutoFollow) {
          const activeTurnPlayer = window.underworld.players[window.underworld.playerTurnIndex];
          if (!window.player.inPortal && window.player.unit.alive) {
            // Follow current client player
            camera = clone(window.player.unit);
          } else if (activeTurnPlayer) {
            // Follow active turn player
            camera = clone(activeTurnPlayer.unit);
          } else {
            // Set camera to the center of the map
            camera = { x: (window.underworld.limits.xMax - window.underworld.limits.xMin) / 2, y: (window.underworld.limits.yMax - window.underworld.limits.yMin) / 2 };
          }
        }
        // Allow camera movement via WSAD
        if (keyDown.w) {
          camera.y -= config.CAMERA_BASE_SPEED;
        }
        if (keyDown.s) {
          camera.y += config.CAMERA_BASE_SPEED;
        }
        if (keyDown.d) {
          camera.x += config.CAMERA_BASE_SPEED;
        }
        if (keyDown.a) {
          camera.x -= config.CAMERA_BASE_SPEED;
        }
        // Clamp centerTarget so that there isn't a lot of empty space
        // in the camera if the camera is in auto follow mode
        if (doCameraAutoFollow) {
          // Users can move the camera further if they are manually controlling the camera
          // whereas if the camera is following a target it keeps more of the map on screen
          const marginY = config.COLLISION_MESH_RADIUS * 4;
          const marginX = config.COLLISION_MESH_RADIUS * 4;
          // Clamp camera X
          const mapLeftMostPoint = 0 - marginX;
          const mapRightMostPoint = window.underworld.limits.xMax + marginX;
          const camCenterXMin = mapLeftMostPoint + elPIXIHolder.clientWidth / 2 / zoom;
          const camCenterXMax = mapRightMostPoint - elPIXIHolder.clientWidth / 2 / zoom;
          // If the supposed minimum is more than the maximum, just center the camera:
          if (camCenterXMin > camCenterXMax) {
            camera.x = (mapRightMostPoint + mapLeftMostPoint) / 2;
          } else {
            // clamp the camera x between the min and max possible camera targets
            camera.x = Math.min(camCenterXMax, Math.max(camCenterXMin, camera.x));
          }

          //Clamp camera Y
          const mapTopMostPoint = 0 - marginY;
          const mapBottomMostPoint = window.underworld.limits.yMax + marginY;
          const camCenterYMin = mapTopMostPoint + elPIXIHolder.clientHeight / 2 / zoom;
          const camCenterYMax = mapBottomMostPoint - elPIXIHolder.clientHeight / 2 / zoom;
          // If the supposed minimum is more than the maximum, just center the camera:
          if (camCenterYMin > camCenterYMax) {
            camera.y = (mapBottomMostPoint + mapTopMostPoint) / 2;
          } else {
            // clamp the camera x between the min and max possible camera targets
            camera.y = Math.min(camCenterYMax, Math.max(camCenterYMin, camera.y));
          }
        }

        // Actuall move the camera to be centered on the centerTarget
        const cameraTarget = {
          x: elPIXIHolder.clientWidth / 2 - (camera.x * zoom),
          y: elPIXIHolder.clientHeight / 2 - (camera.y * zoom)
        }
        // If zoom has changed, move the camera instantly
        // this eliminates odd camera movement when zoom occurs
        if (lastZoom !== zoom) {
          // Move camera immediately because the user is panning
          // the camera manually
          if (!isNaN(cameraTarget.x) && !isNaN(cameraTarget.y)) {
            // Actuall move the camera to be centered on the centerTarget
            app.stage.x = cameraTarget.x;
            app.stage.y = cameraTarget.y;
          }
        } else if (doCameraAutoFollow) {
          // Move smoothly to the cameraTarget
          const camNextCoordinates = math.getCoordsAtDistanceTowardsTarget(
            app.stage,
            cameraTarget,
            math.distance(app.stage, cameraTarget) / 20
          );
          if (!isNaN(camNextCoordinates.x) && !isNaN(camNextCoordinates.y)) {
            // Actuall move the camera to be centered on the centerTarget
            app.stage.x = camNextCoordinates.x;
            app.stage.y = camNextCoordinates.y;
          }
        } else {
          // Move camera immediately because the user is panning
          // the camera manually
          if (!isNaN(cameraTarget.x) && !isNaN(cameraTarget.y)) {
            // Actuall move the camera to be centered on the centerTarget
            app.stage.x = cameraTarget.x;
            app.stage.y = cameraTarget.y;
          }
        }
        lastZoom = zoom;

        // Keep containerUIFixed fixed in the center of the screen
        containerUIFixed.x = -app.stage.x / zoom;
        containerUIFixed.y = -app.stage.y / zoom;
        containerUIFixed.scale.x = 1 / zoom;
        containerUIFixed.scale.y = 1 / zoom;

      }
      break;
  }

}
// PIXI textures
let sheet: PIXI.Spritesheet;
export function setupPixi(): Promise<void> {
  // The application will create a canvas element for you that you
  // can then insert into the DOM
  elPIXIHolder.appendChild(app.view);

  return loadTextures();
}
export function addPixiContainersForView(view: View) {
  app.stage.removeChildren();
  removeContainers(underworldPixiContainers);
  switch (view) {
    case View.Game:
      addContainers(underworldPixiContainers);
      break;
  }
}
function addContainers(containers: PIXI.Container[]) {
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.addChild(container);
  }
}
function removeContainers(containers: PIXI.Container[]) {
  // Add containers to the stage in the order that they will be rendered on top of each other
  for (let container of containers) {
    app.stage.removeChild(container);
  }
}
function loadTextures(): Promise<void> {
  return new Promise((resolve, reject) => {
    const loader = PIXI.Loader.shared;
    // loader.onProgress.add(a => console.log("onProgress", a)); // called once per loaded/errored file
    // loader.onError.add(e => console.error("Pixi loader on error:", e)); // called once per errored file
    // loader.onLoad.add(a => console.log("Pixi loader onLoad", a)); // called once per loaded file
    // loader.onComplete.add(a => console.log("Pixi loader onComplete")); // called once when the queued resources all load.
    const sheetPath = 'sheet1.json';
    loader.add(sheetPath);
    loader.load((_loader, resources) => {
      resources = resources;
      const resource = resources[sheetPath]
      if (resource && resource.spritesheet) {
        sheet = resource.spritesheet as PIXI.Spritesheet;
        isReady = true;
        resolve();
      } else {
        reject();
      }
    });
  });
}

export interface PixiSpriteOptions {
  onFrameChange?: (currentFrame: number) => void,
  onComplete?: () => void,
  loop: boolean,
  animationSpeed?: number
}
// Allows files without access to locally scoped 'sheet' to get an 
// animated texture from the sheet
export function getPixiTextureAnimated(
  imagePath: string
) {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  return sheet.animations[imagePath];
}
export function addPixiSpriteAnimated(
  imagePath: string,
  parent: PIXI.Container,
  options: PixiSpriteOptions = {
    loop: true
  }
): JSpriteAnimated {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  let sprite: JSpriteAnimated;
  let texture = sheet.animations[imagePath];
  if (texture) {
    const animatedSprite = new PIXI.AnimatedSprite(texture);
    animatedSprite.animationSpeed = options.animationSpeed || 0.1;
    if (window.devMode) {
      animatedSprite.animationSpeed = 1.5;
    }
    if (options.onComplete) {
      animatedSprite.onComplete = options.onComplete;
    }
    if (options.onFrameChange) {
      animatedSprite.onFrameChange = options.onFrameChange;
    }
    animatedSprite.loop = options.loop;
    animatedSprite.play();
    // Adding imagePath to a PIXI.AnimatedSprite makes it a JSpriteAnimated object
    sprite = animatedSprite as JSpriteAnimated;
    sprite.imagePath = imagePath;

    parent.addChild(sprite);
    return sprite;
  } else {
    throw new Error(
      'Could not find animated texture for ' + imagePath
    );
  }
}

export function addPixiSprite(
  imagePath: string,
  parent: PIXI.Container,
): PIXI.Sprite {
  if (!isReady) {
    throw new Error(
      'PIXI is not finished setting up.  Cannot add a sprite yet',
    );
  }
  let singleTexture = sheet.textures[imagePath];
  const sprite = new PIXI.Sprite(singleTexture);
  if (!singleTexture) {
    console.error('Could not find non-animated texture for', imagePath);
  }

  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  // which is used for identifying the sprite or animation that is currently active
  sprite.imagePath = imagePath;
  parent.addChild(sprite);
  return sprite;
}
