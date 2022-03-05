import type { Spell } from '.';
import * as Unit from '../Unit'
import { UnitType } from '../commonTypes';
import type { Vec2 } from '../Vec';
import { CardType, cardTypeToProbability } from './cardUtils';

const type = CardType.Special;
const id = 'protection';
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'protection.png',
    description: 'Removes self or ally from existing spell targets.  Will protect 1 allied unit (including self) per use.  Prioritizes protecting yourself, then ally wizards, then other allies.  You may cast more than one in a single spell to protect multiple allies.',
    effect: async (state, dryRun) => {
      const allies = [
        // Prioritize self over all other allies
        state.casterUnit,
        ...Unit.livingUnitsInSameFaction(state.casterUnit)
          .sort((a, b) => {
            // Prioritize PLAYER_CONTROLLED allies over AI controlled allies
            return a.unitType == UnitType.PLAYER_CONTROLLED && b.unitType == UnitType.PLAYER_CONTROLLED ? 0 :
              a.unitType == UnitType.PLAYER_CONTROLLED ? -1 : 1
          })];
      let excludeTarget: Vec2 = { x: NaN, y: NaN };
      // For all the allies, find the first ally that matches a target
      allyLoop: {
        for (let ally of allies) {
          for (let target of state.targets) {
            if (target.x == ally.x && target.y == ally.y) {
              excludeTarget = target;
              // Only remove 1 target per use of this card
              break allyLoop;
            }
          }
        }
      }
      // Update targets
      state.targets = state.targets.filter(t => t.x !== excludeTarget.x && t.y !== excludeTarget.y);

      return state;
    },
  },
};
export default spell;
