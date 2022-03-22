import {
  containerCharacterSelect,
  addPixiContainersForView,
  recenterStage,
} from './PixiUtils';
import * as Units from './units';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import * as Image from './Image';

// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  Setup,
  CharacterSelect,
  // Game view shows all the routes, the overworld, upgrade screen, underworld, etc
  Game,
}
export function setView(v: View) {
  console.log('setView(', View[v], ')');
  window.view = v;
  addPixiContainersForView(v);
  recenterStage();
  const elMenu = document.getElementById('menu') as HTMLElement;
  elMenu.classList.add('hidden');
  switch (v) {
    case View.Menu:
      elMenu.classList.remove('hidden');


      break;
    case View.CharacterSelect:
      // Host or join a game brings client to Character select
      Object.values(Units.allUnits)
        .filter(
          (unitSource) =>
            unitSource.info.subtype === UnitSubType.PLAYER_CONTROLLED,
        )
        .forEach((unitSource, index) => {
          const image = Image.create(
            0,
            0,
            unitSource.info.image,
            containerCharacterSelect,
          );
          Image.setPosition(image, index * image.sprite.width, 0)
          image.sprite.interactive = true;
          image.sprite.on('click', () => {
            // Timeout prevents click from propagating into overworld listener
            // for some reason e.stopPropagation doesn't work :/
            setTimeout(() => {
              // Cleanup container
              containerCharacterSelect.removeChildren();

              // Queue asking for the gamestate
              // from the other players.
              // The reason sending game state is queued and not sent immediately
              // is that if there's a game in progress you don't want to send the
              // state in the middle of an action (which could cause desyncs for
              // code that depends on promises such as resolveDoneMoving)
              console.log("Setup: JOIN_GAME: Ask for latest gamestate from other players")
              window.pie.sendData({
                type: MESSAGE_TYPES.JOIN_GAME,
                unitId: unitSource.id
              })
              // Now that user has selected a character, they can enter the game
              setView(View.Game);
            }, 0);
          });
        });
      break;
    case View.Game:
      break;
    default:
      console.error('Cannot set view to', v, 'no such view exists');
      break;
  }
}
