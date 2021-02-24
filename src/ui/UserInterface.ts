import { MESSAGE_TYPES } from '../MessageTypes';
import setupSpellBuilderUI from './SpellBuilderControls';

// const elControls = document.getElementById('controls');
const elOppTurnStatus = document.getElementById('opponentTurnStatus');
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
const elResetGameButton: HTMLButtonElement = document.getElementById(
  'resetGame',
) as HTMLButtonElement;
const elMana = document.getElementById('mana');
const elHealth = document.getElementById('health');

export function setup() {
  // Add keyboard shortcuts
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
  setupSpellBuilderUI();
}
function endTurn() {
  window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
}
function resetGame() {
  const doReset = window.confirm('Are you sure you want to start over?');
  if (doReset) {
    window.pie.sendData({
      type: MESSAGE_TYPES.RESTART_GAME,
    });
  }
}
export function setHealth(health: number) {
  elHealth.innerText = `${health} Health`;
}
let maxMana;
export function setCurrentMana(mana: number, max?: number) {
  if (max) {
    maxMana = max;
  }
  if (elMana) {
    elMana.innerText = `${mana} / ${maxMana} Mana`;
  }
}
export function turnEnded(isEnded: boolean) {
  elEndTurnBtn.disabled = isEnded;
  elOppTurnStatus.innerText = 'Opponent is thinking...';
}
export function turnEndedOpponent() {
  elOppTurnStatus.innerText = 'Opponent waiting';
}
