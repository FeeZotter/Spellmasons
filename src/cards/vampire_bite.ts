import type { IUnit } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { allCards, Spell } from '.';
import { addCardToHand, removeCardsFromHand } from '../entity/Player';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const id = 'Exsanguinate';
export function isVampire(unit: IUnit): boolean {
  return Object.keys(unit.modifiers).some(m => m === id)
}
function add(unit: IUnit, underworld: Underworld) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  unit.modifiers[id] = { isCurse: true };
  // Add event
  unit.onDamageEvents.push(id);

  // If unit belongs to player
  const player = underworld.players.find(p => p.unit == unit)
  if (player) {
    addCardToHand(allCards[id], player, underworld);
  }
}
function remove(unit: IUnit, underworld: Underworld) {
  // remove subsprite image
  Image.removeSubSprite(unit.image, id);

  // If unit belongs to player
  const player = underworld.players.find(p => p.unit == unit)
  if (player) {
    removeCardsFromHand(player, [id], underworld);
  }

}

const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 0,
    thumbnail: 'bite.png',
    description: `Turns the victim into a Vampire.
    `,
    effect: async (state, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id);
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    subsprite: undefined,
  },
  events: {
    onDamage: (unit: IUnit, amount: number, prediction: boolean, damageDealer?: IUnit) => {
      // Takes healing as damage
      if (amount < 0) {
        return -1 * amount;
      } else {
        // Takes regular damage at half
        return Math.round(amount / 2);

      }
    },
  },
};
export default spell;
