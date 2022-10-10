import { addPickupTarget, addTarget, addUnitTarget, getCurrentTargets, Spell } from './index';
import { drawUICircle } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import { Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import * as config from '../config';
import { easeOutCubic } from '../jmath/Easing';

const id = 'Expand';
const range = 40;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconExpanding.png',
    requiresFollowingCard: true,
    description: `
Adds a radius to the spell so it can affect more targets.
"${id}" can be cast multiple times in succession to stack it's effect.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {

      const adjustedRange = range * quantity;
      state.aggregator.additionalRadius += adjustedRange;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          if (outOfRange) {
            drawUICircle(target, adjustedRange, colors.outOfRangeGrey);
          } else {
            drawUICircle(target, adjustedRange, colors.targetingSpellGreen, 'Expand Radius');
          }
        } else {
          await animate(target, adjustedRange, underworld);
        }
        const withinRadius = underworld.getEntitiesWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Add entities to target
        withinRadius.forEach(e => addTarget(e, state));
      }

      return state;
    },
  },
};
async function animate(pos: Vec2, radius: number, underworld: Underworld) {
  const iterations = 100;
  const millisBetweenIterations = 8;
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedExpand', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        if (globalThis.predictionGraphics) {
          globalThis.predictionGraphics.clear();
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
          globalThis.predictionGraphics.beginFill(colors.targetingSpellGreen, 0.2);

          const animatedRadius = radius * easeOutCubic((i + 1) / iterations)
          globalThis.predictionGraphics.drawCircle(pos.x, pos.y, animatedRadius);
          globalThis.predictionGraphics.endFill();
          // Draw circles around new targets
          const withinRadius = underworld.getEntitiesWithinDistanceOfTarget(
            pos,
            animatedRadius,
            false
          );
          withinRadius.forEach(v => {
            globalThis.predictionGraphics?.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
          })
        }
        if (i >= iterations - 1) {
          resolve();
        }

      }, millisBetweenIterations * i)
    }
  })).then(() => {
    globalThis.predictionGraphics?.clear();
  });
}
export default spell;
