import type * as PIXI from 'pixi.js';
import AnimationTimeline from './AnimationTimeline';
import type * as Player from './Player';
import type * as Unit from './Unit';
import type Underworld from './Underworld';
import { setView, View } from './views';
import * as readyState from './readyState';
import { setupPixi } from './PixiUtils';
import * as Cards from './cards';
import * as Units from './units';
import { initPlanningView } from './ui/PlanningView';
import type PieClient from '@websocketpie/client';
import { setupAudio } from './Audio';
import cookieConsentPopup from './cookieConsent';
import { setupMonitoring } from './monitoring';
import * as storage from './storage';
cookieConsentPopup(false);

// This import is critical so that the svelte menu has access to
// the pie globals
import './wsPieSetup';
import { ENEMY_ENCOUNTERED_STORAGE_KEY } from './contants';
import type { Vec2 } from './Vec';
import type { LevelData } from './Underworld';
import type { Circle } from './collision/moveWithCollision';
import { generateCave } from './MapOrganicCave';
import { isVec2InsidePolygon } from './Polygon';

const YES = 'yes'
const SKIP_TUTORIAL = 'skipTutorial';

// set window defaults, must be called before setupAll()
window.volume = 1.0;
window.volumeMusic = 1.0;
window.volumeGame = 1.0;
window.zoomTarget = 1;
window.playerWalkingPromise = Promise.resolve();
window.predictionUnits = [];
window.attentionMarkers = [];
window.resMarkers = [];
window.lastThoughtsHash = '';
window.playerThoughts = {};
window.forceMove = [];

setupAll();

function setupAll() {
  // Start monitoring with development overlay
  setupMonitoring();

  setupAudio();

  // Start up menu script now that the window globals are assigned
  var script = document.createElement('script');
  script.src = 'svelte-bundle.js';
  script.async = false;
  document.body.appendChild(script);

  // Initialize Assets
  console.log("Setup: Loading Pixi assets...")
  window.setupPixiPromise = setupPixi().then(() => {
    readyState.set('pixiAssets', true);
    console.log("Setup: Done loading Pixi assets.")
    // Initialize content
    Cards.registerCards();
    Units.registerUnits();
    initPlanningView();
    readyState.set("content", true);
    // if (storage.get(SKIP_TUTORIAL) === YES) {
    window.setMenu('PLAY');
    setView(View.Menu);
    // } else {
    //   window.setMenu('TUTORIAL');
    //   startTutorial();
    // }
  }).catch(e => {
    console.error('Setup: Failed to setup pixi', e);
  });

  const elMenu = document.getElementById('menu');
  if (elMenu) {
    // Reveal the menu now that the global variables needed by svelte are set.
    elMenu.classList.add('ready');

  } else {
    // This should never happen
    console.error('Cannot find "menu" element in DOM');
  }

  window.animationTimeline = new AnimationTimeline();

  // Set UI version info
  const elVersionInfo = document.getElementById('version-info')
  if (elVersionInfo && import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION) {
    elVersionInfo.innerText = `Alpha v${import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION}\nGraphics are not final`;
  }
}

declare global {
  interface Window {
    latencyPanel: Stats.Panel;
    runPredictionsPanel: Stats.Panel;
    animationTimeline: AnimationTimeline;
    underworld: Underworld;
    // A reference to the player instance of the client playing on this instance
    player: Player.IPlayer | undefined;
    // Globals needed for Golems-menu
    pie: PieClient;
    connect_to_wsPie_server: (wsUri?: string) => Promise<void>;
    joinRoom: (_room_info: any) => Promise<unknown>;
    setupPixiPromise: Promise<void>;
    // Svelte menu handles
    exitCurrentGame: () => void;
    closeMenu: () => void;
    // Sets which route of the menu is available; note, the view must also
    // be set to Menu in order to SEE the menu
    setMenu: (route: string) => void;
    // Used to tell the menu if a game is ongoing or not
    updateInGameMenuStatus: () => void;
    // The menu will call this if the user chooses to skip the tutorial
    skipTutorial: () => void;

    save: (title: string) => void;
    load: (title: string) => void;
    getAllSaveFiles: () => string[];
    // Save pie messages for later replay
    saveReplay: (title: string) => void;
    // Used to replay onData messages for development
    replay: (title: string) => void;
    // The client id of the host of the game, may or may not be
    // identical to clientId
    hostClientId: string;
    // Current client's id
    clientId: string;
    animatingSpells: boolean;
    view: View;
    // For development use
    giveMeCard: (cardId: string, quantity: number) => void;
    // Set to true in developer console to see debug information
    showDebug: boolean;
    // Graphics for drawing debug information, use window.showDebug = true
    // to show at runtime
    debugGraphics: PIXI.Graphics;
    // Shows radiuses for spells
    radiusGraphics: PIXI.Graphics;
    // Graphics for drawing the player visible path
    walkPathGraphics: PIXI.Graphics;
    // Graphics to show what other players are thinking
    thinkingPlayerGraphics: PIXI.Graphics;
    // Graphics for drawing unit health and mana bars
    unitOverlayGraphics: PIXI.Graphics;

    // Test cave generation
    t: PIXI.Graphics;
    cave: () => void;
    // Test cave generation

    // Graphics for drawing the spell effects during the dry run phase
    predictionGraphics: PIXI.Graphics;
    allowCookies: boolean;
    playMusic: () => void;
    changeVolume: (volume: number) => void;
    changeVolumeMusic: (volume: number) => void;
    changeVolumeGame: (volume: number) => void;
    volume: number;
    volumeMusic: number;
    volumeGame: number;
    startSingleplayer: () => Promise<void>;
    startMultiplayer: (wsPieUrl: string) => Promise<void>;
    // Used to ensure that the current client's turn doesn't end while they are still walking
    // If they invoke endMyTurn() while they are walking, it will wait until they are done
    // walking to end their turn.  If they are not walking, it will end immediately.
    // This property will always be a promise, since it is set immediately below as a resolved
    // promise.  This is so that the promise is always resolved UNLESS the player is currently
    // walking.
    playerWalkingPromise: Promise<void>;
    // makes a pop up prompting the user to accept cookies
    cookieConsentPopup: (forcePopup: boolean) => void;
    // A zoom value that the camera zoom will lerp to
    zoomTarget: number;
    // A list of enemy ids that have been encountered by this client
    // Used to introduce new enemies
    enemyEncountered: string[];
    // Make me superhuman (used for dev)
    superMe: () => void;
    // A local copy of underworld.units used to predict damage and mana use from casting a spell
    predictionUnits: Unit.IUnit[];
    // Shows icons above the heads of enemies who will damage you next turn
    attentionMarkers: Vec2[];
    // Shows icon for units that will be successfully resurrected
    resMarkers: Vec2[];
    // Keep track of the LevelData from the last level that was created in
    // case it needs to be sent to another client
    lastLevelCreated: LevelData;
    // True if client player has casted this turn;
    // Used to prompt before ending turn without taking any action
    castThisTurn: boolean;
    // Turns on fps monitoring
    monitorFPS: () => void;
    // A hash of the last thing this client was thinking
    // Used with MESSAGE_TYPES.PLAYER_THINKING so other clients 
    // can see what another client is planning.
    // The hash is used to prevent sending the same data more than once
    lastThoughtsHash: string;
    playerThoughts: { [clientId: string]: { target: Vec2, cardIds: string[] } };
    // A list of units and pickups and an endPosition that they are moved to via a "force",
    // like a push or pull or explosion.
    forceMove: { pushedObject: Circle, step: Vec2, distance: number }[];
    // Middle Mouse Button Down
    // Note: do NOT set directly, use setMMBDown instead
    readonly MMBDown: boolean;
    // Used to set MMBDown so it will affect CSS too
    setMMBDown: (isDown: boolean) => void;
    // Allows manually overriding the underworld seed via the JS console
    seedOverride: string | undefined;
  }
}
window.setMMBDown = (isDown: boolean) => {
  // I want it to show a compile error anywhere else
  // @ts-expect-error Override "readyonly" error.  This is the ONLY place that MMBDown should be mutated.
  window.MMBDown = isDown;
  document.body.classList.toggle('draggingCamera', window.MMBDown);
}
window.skipTutorial = () => {
  storage.set(SKIP_TUTORIAL, YES);
}
window.enemyEncountered = JSON.parse(storage.get(ENEMY_ENCOUNTERED_STORAGE_KEY) || '[]');
console.log('Setup: initializing enemyEncountered as', window.enemyEncountered);

window.superMe = () => {
  if (window.player) {

    window.player.unit.health = 10000;
    window.player.unit.healthMax = 10000;
    window.player.unit.mana = 10000;
    window.player.unit.manaMax = 10000;
    // Give me all cards
    Object.keys(Cards.allCards).forEach(window.giveMeCard);
    // Run farther! Jump higher!
    window.player.unit.staminaMax = 10000;
    window.player.unit.stamina = window.player.unit.staminaMax;
    window.player.unit.moveSpeed = 2;
    // Now that player's health and mana has changed we must sync
    // predictionUnits so that the player's prediction copy
    // has the same mana and health
    window.underworld.syncPredictionUnits();
  }
}
// window.showDebug = true;

window.onbeforeunload = function () { return "Are you sure you want to quit?"; };
window.bowties = [];
window.cave = () => {
  window.t.clear();
  const cave = generateCave();

  const styles = [0xff0000, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00];
  function drawPathWithStyle(path: Vec2[], style: number, opacity: number) {
    window.t.lineStyle(4, style, opacity);
    if (path[0]) {
      window.t.moveTo(path[0].x, path[0].y);
      // @ts-expect-error
      window.t.drawCircle(path[1].x, path[1].y, 25);
      for (let point of path) {
        window.t.lineTo(point.x, point.y);
      }
    }

  }
  // Get bounds
  let bounds = {
    xMin: NaN,
    xMax: NaN,
    yMin: NaN,
    yMax: NaN
  }
  bounds = cave.reduce((b, crawler) => {
    for (let p of [...crawler.left, ...crawler.right]) {
      if (Number.isNaN(b.xMin) || p.x < b.xMin) {
        b.xMin = p.x;
      }
      if (Number.isNaN(b.yMin) || p.y < b.yMin) {
        b.yMin = p.y;
      }
      if (Number.isNaN(b.xMax) || p.x > b.xMax) {
        b.xMax = p.x;
      }
      if (Number.isNaN(b.yMax) || p.y > b.yMax) {
        b.yMax = p.y;
      }
    }
    return b
  }, bounds);

  // Draw bounds
  window.t.lineStyle(2, 0xff0000, 1.0);
  window.t.moveTo(bounds.xMin, bounds.yMin);
  window.t.lineTo(bounds.xMin, bounds.yMax);
  window.t.lineTo(bounds.xMax, bounds.yMax);
  window.t.lineTo(bounds.xMax, bounds.yMin);
  window.t.lineTo(bounds.xMin, bounds.yMin);
  //  Draw dot grid
  const dotSize = 64;
  for (let x = bounds.xMin; x < bounds.xMax; x += dotSize) {
    for (let y = bounds.yMin; y < bounds.yMax; y += dotSize) {
      let isInside = false;
      for (let crawler of cave) {
        for (let rect of crawler.rectagles) {
          if (isVec2InsidePolygon({ x, y }, { points: rect, inverted: false })) {
            isInside = true;
            if (x == bounds.xMin) {
              console.log('jtest RECT', x, y, rect);
              window.bowties.push(rect);
            }
            break;
          }
        }
        if (isInside) {
          break;
        }
      }
      window.t.lineStyle(2, isInside ? 0x00ff00 : 0xff0000, 1.0);
      if (isInside) {
        window.t.beginFill(0x00ff00, 0.5);
        window.t.drawRect(x, y, dotSize, dotSize);
        window.t.endFill();
      } else {
        window.t.drawCircle(x, y, 4);
      }
    }
  }

  // Fill
  for (let i = 0; i < cave.length; i++) {
    const crawler = cave[i];
    if (crawler) {
      drawPathWithStyle(crawler.path, 0x000000, 1.0);
      // window.t.beginFill(styles[i % styles.length], 0.2);
      // for (let rect of crawler.rectagles) {
      //   window.t.drawPolygon(rect);
      // }
      // window.t.endFill();
    }
  }
  for (let bowtie of window.bowties) {
    window.t.beginFill(0xff0000, 0.9);
    window.t.drawPolygon(bowtie);
    window.t.endFill();
    drawPathWithStyle(bowtie, 0x0000ff, 1.0);

  }

  // // Lines
  // for (let i = 0; i < cave.length; i++) {
  //   const crawler = cave[i];
  //   if (crawler) {
  //     drawPathWithStyle(crawler.path, styles[i % styles.length] as number, 1.0);
  //     window.t.lineStyle(1, 0x000000, 0.0);
  //     // window.t.beginFill(styles[i % styles.length], 1.0);
  //     // window.t.drawPolygon(poly);
  //     // window.t.endFill();
  //   }
  // }
}