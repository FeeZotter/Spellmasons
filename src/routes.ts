import { addPixiContainersForRoute, setupPixi } from './PixiUtils';
import {
  clickHandler,
  clickHandlerOverworld,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mousemoveHandler,
} from './ui/eventListeners';
import * as Cards from './cards';
import * as Units from './units';
import * as Overworld from './overworld';
import { initializeGameObject } from './wsPieHandler';
import { connect_to_wsPie_server, hostRoom, joinRoom } from './wsPieSetup';
import { setupMonitoring } from './monitoring';
import { app } from './PixiUtils';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from './config';

export enum Route {
  Menu,
  CharacterSelect,
  // Overworld is where players, as a team, decide which level to tackle next
  Overworld,
  // Underworld contains the grid with levels and casting
  Underworld,
  // Post combat
  Upgrade,
}
let route: Route = Route.Menu;
// temp for testing
window.setRoute = setRoute;

export function setRoute(r: Route) {
  console.log('Set game route', Route[r]);
  for (let route of Object.keys(Route)) {
    document.body.classList.remove(`route-${route}`);
  }
  document.body.classList.add(`route-${Route[r]}`);
  route = r;
  addPixiContainersForRoute(r);

  // Remove previous event listeners:
  removeOverworldEventListeners();
  removeUnderworldEventListeners();
  switch (r) {
    case Route.Menu:
      // Start monitoring with development overlay
      setupMonitoring();
      // Initialize content
      Cards.registerCards();
      Units.registerUnits();

      // Initialize Assets
      let setupPixiPromise = setupPixi();
      // Initialize Network
      let connectToPieServerPromise = connect_to_wsPie_server();
      Promise.all([setupPixiPromise, connectToPieServerPromise]).then(() => {
        // Now that we are both connected to the pieServer and assets are loaded,
        // we can host or join a game

        // Initialize Game Object
        // See makeGame function for where setup truly happens
        // This instantiation just spins up the instance of game
        initializeGameObject();
        // ---
        // TEMP temporarily default to just entering a generic game for speed of development
        hostRoom({})
          .catch(() => joinRoom({}))
          .then(() => console.log('You are now in the room'))
          .then(() => {
            setRoute(Route.Overworld);
          })
          .catch((err: string) => console.error('Failed to join room', err));
      });
      break;
    case Route.CharacterSelect:
      // Host or join a game brings client to Character select
      break;
    case Route.Overworld:
      // Picking a level brings players to Underworld from Overworld
      const overworld = Overworld.generate();
      window.overworld = overworld;
      Overworld.draw(overworld);
      // Align camera:
      app.stage.x = app.stage.width / 2 - overworld.levels[0].location.x;
      app.stage.y = app.stage.height - overworld.levels[0].location.y;
      addOverworldEventListeners();

      break;
    case Route.Underworld:
      // Align Camera: center the app in the middle of the board
      app.stage.x = app.renderer.width / 2 - (CELL_SIZE * BOARD_WIDTH) / 2;
      app.stage.y = app.renderer.height / 2 - (CELL_SIZE * BOARD_HEIGHT) / 2;
      addUnderworldEventListeners();
      // Beating a level takes players from Underworld to Upgrade
      break;
    case Route.Upgrade:
      break;
  }
}
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
elEndTurnBtn.addEventListener('click', endTurnBtnListener);

function addOverworldEventListeners() {
  // Add keyboard shortcuts
  document.body.addEventListener('click', clickHandlerOverworld);
}
function removeOverworldEventListeners() {
  document.body.removeEventListener('click', clickHandlerOverworld);
}
function addUnderworldEventListeners() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', keydownListener);
  window.addEventListener('keyup', keyupListener);
  document.body.addEventListener('contextmenu', contextmenuHandler);
  document.body.addEventListener('click', clickHandler);
  document.body.addEventListener('mousemove', mousemoveHandler);
}

function removeUnderworldEventListeners() {
  // Remove keyboard shortcuts
  window.removeEventListener('keydown', keydownListener);
  window.removeEventListener('keyup', keyupListener);
  // Remove mouse and click listeners
  document.body.removeEventListener('contextmenu', contextmenuHandler);
  document.body.removeEventListener('click', clickHandler);
  document.body.removeEventListener('mousemove', mousemoveHandler);
}
