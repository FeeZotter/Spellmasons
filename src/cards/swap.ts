import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import type { Spell } from '.';
import type { Vec2 } from '../Vec';
import { drawSwapLine } from '../ui/PlanningView';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'swap';
const type = CardType.Powerful;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'swap.png',
    description: `
Swaps the caster with the source target.
    `,
    effect: async (state, dryRun) => {
      const { casterUnit, targets } = state;
      // Loop through all targets and batch swap locations
      const swapUnits: [Unit.IUnit, Vec2][] = [];
      const swapPickups: [Pickup.IPickup, Vec2][] = [];
      const swapLocation = { x: casterUnit.x, y: casterUnit.y };
      // The unit at the location that the targetUnit will swap to
      const swapUnit = window.underworld.getUnitAt(swapLocation);
      if (swapUnit) {
        swapUnits.push([swapUnit, targets[0]]);
      }
      // The units at the target location
      for (let target of targets) {
        const targetUnit = window.underworld.getUnitAt(target);
        if (targetUnit) {
          swapUnits.push([targetUnit, swapLocation]);
        }
        // The pickup at the target location
        const pickupAtTarget = window.underworld.getPickupAt(target);
        // Physically swap with pickups
        if (pickupAtTarget) {
          swapPickups.push([pickupAtTarget, swapLocation]);
        }
        // The pickup at the swap location
        const pickupAtSwap = window.underworld.getPickupAt(swapLocation);

        if (pickupAtSwap) {
          swapPickups.push([pickupAtSwap, target]);
        }
      }
      for (let [pickup, newLocation] of swapPickups) {
        if (dryRun) {
          drawSwapLine(pickup, newLocation);
        } else {
          // Physically swap
          Pickup.setPosition(pickup, newLocation.x, newLocation.y);
        }
      }
      for (let [unit, newLocation] of swapUnits) {
        if (dryRun) {
          drawSwapLine(unit, newLocation);
        } else {
          // Physically swap
          // TODO, ensure that multiple units don't appear in exactly the same location
          Unit.setLocation(unit, newLocation);
        }
      }
      return state;
    },
  },
};
export default spell;
