import { MESSAGE_TYPES } from './index';
import Game, { game_state } from './Game';

const elControls = document.getElementById('controls');
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
const elResetGameButton: HTMLButtonElement = document.getElementById(
  'resetGame',
) as HTMLButtonElement;
const elMana = document.getElementById('mana');

export function setup() {
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Space':
        endTurn();
        break;
      default:
        console.log('No set action for key' + event.code);
    }
  });
  elEndTurnBtn.addEventListener('click', endTurn);
  elResetGameButton.addEventListener('click', resetGame);
}
function endTurn() {
  window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
}
function resetGame() {
  const doReset = window.confirm('Are you sure you want to start over?');
  if (doReset) {
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      game: new Game(),
    });
  }
}
export function turnEnded(isEnded: boolean) {
  elEndTurnBtn.disabled = isEnded;
}
